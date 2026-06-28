import { expect, test, type Page } from "@playwright/test";
import { completeLoginCode, requestLoginCode } from "./helpers";

async function expectFooterIconsCompact(page: Page) {
  for (const name of ["dev", "OpenAI"]) {
    const box = await page.getByRole("img", { name }).boundingBox();
    expect(box?.width).toBeLessThanOrEqual(18);
    expect(box?.height).toBeLessThanOrEqual(18);
  }
}

test("exibe o login por email sem overflow horizontal", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Planning Poker" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Enviar código/i }),
  ).toBeVisible();
  await expect(page.getByText("login.request")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toContainText("Criado por");
  await expect(page.getByRole("contentinfo")).toContainText("reinasdev");
  await expect(page.getByRole("contentinfo")).toContainText("codex");
  await expect(page.getByRole("img", { name: "dev" })).toBeVisible();
  await expect(page.getByRole("img", { name: "OpenAI" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Alternar tema" }),
  ).toBeVisible();
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
  await page.getByRole("button", { name: "Alternar tema" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Alternar tema" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expectFooterIconsCompact(page);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: "Email" })).toBeFocused();

  const bodyContrast = await page.evaluate(() => {
    const parse = (value: string) =>
      value.match(/\d+/g)!.slice(0, 3).map(Number);
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
    const style = getComputedStyle(document.body);
    const foreground = luminance(parse(style.color));
    const background = luminance(parse(style.backgroundColor));
    return (
      (Math.max(foreground, background) + 0.05) /
      (Math.min(foreground, background) + 0.05)
    );
  });
  expect(bodyContrast).toBeGreaterThanOrEqual(4.5);

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("redireciona pagina inexistente para a raiz", async ({ page }) => {
  await page.goto("/rota-inexistente-404");

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "Planning Poker" }),
  ).toBeVisible();
});

test("mantem icones do rodape compactos em codigo magico e primeiro acesso", async ({
  page,
  request,
}) => {
  test.slow();

  const email = `icons-${crypto.randomUUID().slice(0, 8)}@example.test`;

  await page.goto("/");
  await requestLoginCode(page, email);
  await expect(
    page.getByRole("heading", { name: "Confira seu email" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Alternar tema" }),
  ).toBeVisible();
  await expectFooterIconsCompact(page);

  await completeLoginCode(page, request, email);
  await expect(page).toHaveURL(/\/onboarding/);
  await expect(
    page.getByRole("heading", { name: "Primeiro acesso" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Alternar tema" }),
  ).toBeVisible();
  await expectFooterIconsCompact(page);
});
