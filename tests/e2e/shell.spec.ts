import { expect, test, type Page } from "@playwright/test";
import { identityUrl, loginNewUser, pokerUrl } from "./helpers";

function contrastScript(element: Element) {
  const parse = (value: string) => {
    const hex = value.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
    if (hex) return hex.slice(1).map((channel) => parseInt(channel, 16));
    const channels = value.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    if (value.startsWith("color(srgb"))
      return channels.map((channel) => channel * 255);
    return channels;
  };
  const luminance = (rgb: number[]) =>
    rgb
      .map((value) => {
        const channel = value / 255;
        return channel <= 0.03928
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4;
      })
      .reduce(
        (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
        0,
      );
  const style = getComputedStyle(element);
  const foreground = luminance(parse(style.color));
  const background = luminance(parse(style.backgroundColor));
  return (
    (Math.max(foreground, background) + 0.05) /
    (Math.min(foreground, background) + 0.05)
  );
}

async function expectFooterMarksCompact(page: Page) {
  for (const name of ["dev", "Claude"]) {
    const box = await page.getByLabel(name, { exact: true }).boundingBox();
    expect(box?.width).toBeLessThanOrEqual(18);
    expect(box?.height).toBeLessThanOrEqual(18);
  }
}

test("visitante é levado ao reinas-id carregando o destino", async ({
  page,
}) => {
  await page.goto("/rooms");

  await expect(page).toHaveURL(new RegExp(`${identityUrl}/login`));
  const url = new URL(page.url());
  expect(url.searchParams.get("client_id")).toBe("reinas-poker");
  expect(url.searchParams.get("redirect_uri")).toBe(
    `${pokerUrl}/auth/callback`,
  );
  expect(url.searchParams.get("state")).toBe("/rooms");
  await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
});

test("link de sala inexistente cai no login sem destino inventado", async ({
  page,
}) => {
  // A sala é procurada antes da sessão: um slug que não existe vira a raiz,
  // em vez de mandar o visitante logar para só então descobrir que não há sala.
  await page.goto("/nada01?senha=1234");
  await expect(page).toHaveURL(new RegExp(`${identityUrl}/login`));
  expect(new URL(page.url()).searchParams.get("state")).toBe("/rooms");
});

test("callback sem código volta para o login em vez de quebrar", async ({
  page,
}) => {
  await page.goto("/auth/callback");
  await expect(page).toHaveURL(new RegExp(`${identityUrl}/login`));
});

test("código de autorização inválido mostra erro e oferece nova tentativa", async ({
  page,
}) => {
  await page.goto("/auth/callback?code=nao-existe&state=%2Frooms");
  await expect(
    page.getByRole("heading", { name: "Não foi possível entrar" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Tentar novamente" })).toBeVisible();
});

test("rota inexistente volta para a raiz", async ({ page }) => {
  await page.goto("/rota-inexistente-404");
  await expect(page).toHaveURL(new RegExp(`${identityUrl}/login`));
});

test("o healthcheck responde ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
  expect((await response.json()).status).toBe("ok");
});

test("a área autenticada tem favicons, rodapé compacto e sem overflow", async ({
  page,
  request,
}) => {
  test.slow();
  const email = `shell-${crypto.randomUUID().slice(0, 8)}@example.test`;
  await loginNewUser(page, request, email, "Shell E2E");

  await expect(
    page.locator(
      'link[rel="icon"][href="/favicon-light.svg"][media="(prefers-color-scheme: light)"]',
    ),
  ).toHaveCount(1);
  await expect(
    page.locator(
      'link[rel="icon"][href="/favicon-dark.svg"][media="(prefers-color-scheme: dark)"]',
    ),
  ).toHaveCount(1);

  await expect(page.getByRole("contentinfo")).toContainText("Criado por");
  await expect(page.getByRole("contentinfo")).toContainText("reinasdev");
  await expect(page.getByRole("contentinfo")).toContainText("claude");
  await expect(page.getByRole("contentinfo")).not.toContainText("codex");
  await expectFooterMarksCompact(page);

  await expect
    .poll(() => page.locator("body").evaluate(contrastScript))
    .toBeGreaterThanOrEqual(4.5);

  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
  ).toBe(false);
});
