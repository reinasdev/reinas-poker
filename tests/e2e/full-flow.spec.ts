import { expect, test, type Locator } from "@playwright/test";
import {
  addTask,
  createRoom,
  identityUrl,
  loginExistingUser,
  loginNewUser,
  pokerUrl,
} from "./helpers";

test.setTimeout(180_000);

async function contrastRatio(locator: Locator) {
  return locator.evaluate((element) => {
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
  });
}

test("fluxo completo persiste, sincroniza por SSE e finaliza somente leitura", async ({
  browser,
  request,
}) => {
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6);
  const slug = suffix.toLowerCase();

  const adminContext = await browser.newContext();
  await adminContext.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: pokerUrl,
  });
  const participantContext = await browser.newContext();
  const admin = await adminContext.newPage();
  const participant = await participantContext.newPage();

  const adminConsoleErrors: string[] = [];
  admin.on("console", (message) => {
    if (message.type() === "error") adminConsoleErrors.push(message.text());
  });

  await loginNewUser(
    admin,
    request,
    `admin-${suffix}@example.test`,
    "Admin E2E",
  );
  await expect(
    admin.getByRole("navigation", { name: "Navegação principal" }),
  ).toBeVisible();

  await createRoom(admin, {
    name: "Sprint E2E",
    slug,
    password: "1234",
    style: "FIBONACCI",
  });
  await expect(admin.getByText("Compartilhar sala")).toBeVisible();
  await expect(admin.getByText(new RegExp(`^/${slug}$`)).last()).toBeVisible();
  await expect(admin.getByText("1234", { exact: true })).toBeVisible();
  await expect(
    admin.getByText(new RegExp(`/${slug}\\?senha=1234`)),
  ).toBeVisible();
  expect(adminConsoleErrors.join("\n")).not.toMatch(/hydration|hydrated/i);

  // O QR entra por import dinâmico; precisa aparecer mesmo assim.
  await expect(admin.getByLabel("QR code da sala")).toBeVisible({
    timeout: 15_000,
  });
  await admin.getByRole("button", { name: "Copiar convite" }).click();
  await expect(admin.getByText("Convite copiado.")).toBeVisible();
  await expect(
    admin.evaluate(() => navigator.clipboard.readText()),
  ).resolves.toContain(`/${slug}?senha=1234`);

  await loginNewUser(
    participant,
    request,
    `participant-${suffix}@example.test`,
    "Participant E2E",
    `/${slug}?senha=1234`,
    `/${slug}`,
  );
  await expect(participant.getByLabel("Senha de 4 dígitos")).toHaveCount(0);
  await expect(
    participant.getByRole("heading", { name: "Sprint E2E" }),
  ).toBeVisible();

  await addTask(admin, "Issue One", "https://example.com/one");
  await addTask(admin, "Issue Two", "https://example.com/two");

  await expect(admin.getByText("Em votação", { exact: true })).toBeVisible();
  await expect(admin.getByText("Pendente", { exact: true })).toBeVisible();
  await expect(admin.getByText(/PENDING|VOTING|COMPLETED/)).toHaveCount(0);

  const activeTask = participant.getByRole("heading", {
    name: /Issue One|Issue Two/,
  });
  await expect(activeTask).toBeVisible({ timeout: 15_000 });
  await expect(
    participant.getByRole("link", { name: "Abrir tarefa" }),
  ).toBeVisible();
  const firstTask = (await activeTask.textContent()) ?? "Issue One";
  const nextTask = firstTask === "Issue One" ? "Issue Two" : "Issue One";

  await participant.getByRole("button", { name: "8", exact: true }).click();
  await expect(
    participant.getByRole("button", { name: "8", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  // A cor anima por 150ms; medir na hora pega o meio da transição.
  await expect
    .poll(() =>
      contrastRatio(participant.getByRole("button", { name: "8", exact: true })),
    )
    .toBeGreaterThanOrEqual(4.5);

  // O voto chega ao admin por SSE, ainda oculto.
  await expect(admin.getByText("Votou")).toBeVisible({ timeout: 15_000 });
  await expect(
    admin.getByText("Participant E2E").locator(".."),
  ).not.toContainText("8");

  await admin.getByRole("button", { name: "Revelar votos" }).click();
  await expect(
    participant.getByText("Participant E2E").last().locator(".."),
  ).toContainText("8", { timeout: 15_000 });

  await admin.getByRole("button", { name: "Reiniciar" }).click();
  await participant.getByRole("button", { name: "13", exact: true }).click();
  await admin.getByRole("button", { name: "Revelar votos" }).click();
  await admin.getByRole("button", { name: "Concluir: 13" }).click();
  await expect(
    participant.getByRole("heading", { name: nextTask }),
  ).toBeVisible({ timeout: 15_000 });

  await admin.getByRole("button", { name: "Finalizar sala" }).click();
  await expect(admin.getByText("Sala finalizada")).toBeVisible();
  await expect(participant.getByText("Sala finalizada")).toBeVisible({
    timeout: 20_000,
  });
  await expect(admin.getByText("Resumo somente leitura")).toBeVisible();
  await expect(admin.getByText("Issue One")).toBeVisible();
  await expect(admin.getByText("Issue Two")).toBeVisible();
  await expect(admin.getByText("Concluída", { exact: true })).toHaveCount(2);
  await expect(
    admin.getByRole("button", { name: /Revelar|Finalizar|Adicionar/ }),
  ).toHaveCount(0);

  await participant.getByRole("button", { name: "Voltar" }).click();
  await expect(participant).toHaveURL(/\/rooms$/);
  await expect(participant.getByText("Sprint E2E")).toBeVisible();

  // Sair precisa encerrar também a sessão no reinas-id.
  await admin.getByRole("button", { name: "Sair" }).click();
  await expect(admin).toHaveURL(new RegExp(`${identityUrl}/login`), {
    timeout: 20_000,
  });

  expect(
    await participant.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);

  await adminContext.close();
  await participantContext.close();
});

test("login com nome existente, tema, troca de nome e retorno sem senha", async ({
  page,
  request,
}) => {
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6);
  const email = `profile-${suffix}@example.test`;
  const slug = `p${suffix}`.slice(0, 6);
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await loginNewUser(page, request, email, "Nome Inicial");
  await createRoom(page, {
    name: "Sala Perfil",
    slug,
    password: "1234",
    style: "SCRUM",
  });

  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(new RegExp(`${identityUrl}/login`), {
    timeout: 20_000,
  });

  // Quem já tem nome volta direto para as salas, sem passar pelo perfil.
  await loginExistingUser(page, request, email);
  await expect(page).toHaveURL(/\/rooms$/);
  await expect(page.getByText("Sala Perfil")).toBeVisible();
  await expect(page.getByText("Admin", { exact: true })).toBeVisible();
  await expect(page.getByRole("contentinfo")).toContainText("reinasdev");
  await expect(page.getByRole("contentinfo")).toContainText("claude");

  await page.getByRole("button", { name: "Alternar tema" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect
    .poll(() => contrastRatio(page.getByText("Admin", { exact: true })))
    .toBeGreaterThanOrEqual(4.5);
  await page.getByRole("button", { name: "Alternar tema" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(consoleErrors.join("\n")).not.toContain("hydrated");

  await page.getByRole("button", { name: /Nome Inicial/ }).click();
  await page.getByLabel("profile.name").fill("Nome Atualizado");
  await page.getByRole("button", { name: "Trocar nome" }).click();
  await expect(
    page.getByRole("button", { name: /Nome Atualizado/ }),
  ).toBeVisible();

  await page.getByText("Sala Perfil").click();
  await expect(page).toHaveURL(new RegExp(`/${slug}$`));
  await expect(page.getByLabel("Senha de 4 dígitos")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Nenhuma tarefa na fila" }),
  ).toBeVisible();
});
