import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import {
  addTask,
  loginExistingUser,
  loginNewUser,
  requestLoginCode,
  completeLoginCode,
  latestEmailHtml,
} from "./helpers";

test.setTimeout(180_000);

const outputRoot = path.join("test-results", "manual-flows");

async function capture(page: Page, folder: string, name: string) {
  await page.waitForLoadState("domcontentloaded");
  await page
    .getByRole("status")
    .filter({ hasText: "Carregando..." })
    .waitFor({ state: "hidden", timeout: 10_000 })
    .catch(() => undefined);
  await page.waitForTimeout(250);
  await page
    .addStyleTag({
      content:
        "nextjs-portal,[data-nextjs-toast],[data-nextjs-dialog-overlay],[data-nextjs-build-error]{display:none!important;visibility:hidden!important}",
    })
    .catch(() => undefined);
  await page.screenshot({
    path: path.join(outputRoot, folder, `${name}.png`),
    fullPage: true,
  });
}

test("gera prints separados por fluxo principal da aplicação", async ({
  browser,
  request,
}) => {
  test.skip(
    test.info().project.name !== "desktop-chromium",
    "Screenshots are captured once to avoid duplicate folders.",
  );
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6);
  const adminEmail = `prints-admin-${suffix}@example.test`;
  const participantEmail = `prints-member-${suffix}@example.test`;
  const slug = `f${suffix}`.slice(0, 6);

  const adminContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const participantContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const returningContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const admin = await adminContext.newPage();
  const participant = await participantContext.newPage();
  const returning = await returningContext.newPage();

  await admin.goto("/");
  await capture(admin, "01-login-sem-nome", "01-login");
  await requestLoginCode(admin, adminEmail);
  const emailHtml = await latestEmailHtml(request, adminEmail);
  expect(emailHtml).toContain("auth.magic_code");
  expect(emailHtml).toContain("Planning Poker");
  const emailPreview = await adminContext.newPage();
  await emailPreview.setViewportSize({ width: 900, height: 900 });
  await emailPreview.setContent(emailHtml, {
    waitUntil: "domcontentloaded",
  });
  await capture(emailPreview, "15-email-codigo-magico", "01-template-email");
  await emailPreview.close();
  await capture(admin, "01-login-sem-nome", "02-codigo-magico");
  await completeLoginCode(admin, request, adminEmail);
  await expect(admin).toHaveURL(/\/onboarding/);
  await capture(admin, "01-login-sem-nome", "03-primeiro-acesso");
  await admin.getByLabel("Como devemos chamar você?").fill("Admin Prints");
  await admin.getByRole("button", { name: "Continuar" }).click();
  await expect(admin).toHaveURL(/\/rooms$/);
  await capture(admin, "01-login-sem-nome", "04-minhas-salas-vazio");

  await admin.getByRole("button", { name: "Alternar tema" }).click();
  await capture(admin, "02-tema", "01-light-mode");
  await admin.getByRole("button", { name: "Alternar tema" }).click();
  await capture(admin, "02-tema", "02-dark-mode");

  await admin.getByRole("button", { name: /Admin Prints/ }).click();
  await capture(admin, "03-trocar-nome", "01-menu-perfil");
  await admin.getByLabel("profile.name").fill("Admin Renomeado");
  await admin.getByRole("button", { name: "Trocar nome" }).click();
  await expect(
    admin.getByRole("button", { name: /Admin Renomeado/ }),
  ).toBeVisible();
  await capture(admin, "03-trocar-nome", "02-nome-atualizado");

  await admin.getByRole("button", { name: "Criar sala" }).click();
  await expect(admin).toHaveURL(/\/rooms\/new$/);
  await capture(admin, "04-criar-sala", "01-formulario");
  await admin.getByLabel("Nome").fill("Sala Prints");
  await admin.getByLabel("Link personalizado").fill(slug);
  await admin.getByLabel("Senha de 4 dígitos").fill("1234");
  await admin.getByLabel("Estilo de votação").selectOption("FIBONACCI");
  await capture(admin, "04-criar-sala", "02-preenchida");
  await admin
    .locator("form")
    .getByRole("button", { name: "Criar sala" })
    .click();
  await expect(admin).toHaveURL(new RegExp(`/${slug}$`));
  await expect(admin.getByText("Compartilhar sala")).toBeVisible();
  await expect(admin.getByLabel("QR code da sala")).toBeVisible();
  await capture(admin, "04-criar-sala", "03-sala-criada");
  await capture(admin, "09-compartilhar-sala", "01-link-codigo-qrcode");

  await admin.getByRole("button", { name: "Minhas salas" }).click();
  await expect(admin).toHaveURL(/\/rooms$/);
  await expect(admin.getByText("Sala Prints")).toBeVisible();
  await capture(admin, "05-minhas-salas", "01-sala-criada-listada");

  await loginNewUser(
    participant,
    request,
    participantEmail,
    "Participante Prints",
    `/${slug}`,
    `/${slug}`,
  );
  await capture(participant, "06-entrar-em-sala", "01-pedir-senha-mobile");
  await participant.getByLabel("Senha de 4 dígitos").fill("1234");
  await participant.getByRole("button", { name: "Entrar na sala" }).click();
  await expect(participant.getByLabel("Senha de 4 dígitos")).toHaveCount(0);
  await capture(participant, "06-entrar-em-sala", "02-sala-ingressada-mobile");

  await participant.getByRole("button", { name: "Minhas salas" }).click();
  await expect(participant).toHaveURL(/\/rooms$/);
  await expect(participant.getByText("Sala Prints")).toBeVisible();
  await capture(
    participant,
    "07-minhas-salas-participante",
    "01-sala-ingressada-listada",
  );
  await participant.getByText("Sala Prints").click();
  await expect(participant).toHaveURL(new RegExp(`/${slug}$`));
  await expect(participant.getByLabel("Senha de 4 dígitos")).toHaveCount(0);
  await capture(participant, "08-retorno-sem-senha", "01-acesso-direto-mobile");

  await admin.getByText("Sala Prints").click();
  await expect(admin).toHaveURL(new RegExp(`/${slug}$`));
  await addTask(
    admin,
    "API observability",
    "https://example.com/observability",
  );
  await addTask(admin, "Cache strategy", "https://example.com/cache");
  await capture(admin, "09-fila-de-tarefas", "01-tarefas-adicionadas");
  await participant.getByRole("button", { name: "8", exact: true }).click();
  await expect(
    participant.getByRole("button", { name: "8", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await capture(participant, "10-votacao", "00-voto-selecionado-mobile");
  await expect(admin.getByText("Votou")).toBeVisible();
  await capture(admin, "10-votacao", "01-voto-oculto");
  await admin.getByRole("button", { name: "Revelar votos" }).click();
  await expect(admin.getByText("Votos revelados")).toBeVisible();
  await capture(admin, "10-votacao", "02-votos-revelados");
  await admin.getByRole("button", { name: "Concluir: 8" }).click();
  await expect(
    admin.getByRole("heading", { name: "Cache strategy" }),
  ).toBeVisible();
  await capture(admin, "11-proxima-tarefa", "01-proxima-tarefa");
  await admin.getByRole("button", { name: "Finalizar sala" }).click();
  await expect(admin.getByText("Sala finalizada")).toBeVisible();
  await capture(admin, "12-resumo-finalizado", "01-resumo-desktop");
  await expect(participant.getByText("Sala finalizada")).toBeVisible();
  await capture(participant, "12-resumo-finalizado", "02-resumo-mobile");

  await loginExistingUser(returning, request, adminEmail);
  await expect(returning).toHaveURL(/\/rooms$/);
  await capture(returning, "13-login-com-nome-ja", "01-direto-minhas-salas");
  await returning.getByRole("button", { name: "Sair" }).click();
  await expect(returning).toHaveURL(/\/$/);
  await capture(returning, "14-logout", "01-login-apos-sair");

  await adminContext.close();
  await participantContext.close();
  await returningContext.close();
});
