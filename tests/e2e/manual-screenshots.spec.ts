import { expect, test } from "@playwright/test";
import {
  addTask,
  capture,
  completeLoginCode,
  latestEmailHtml,
  loginExistingUser,
  loginNewUser,
  requestLoginCode,
} from "./helpers";

test.setTimeout(240_000);

test("gera prints separados por fluxo principal da aplicação", async ({
  browser,
  request,
}) => {
  test.skip(
    test.info().project.name !== "desktop-chromium",
    "Os prints são capturados uma vez só, para não duplicar as pastas.",
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

  // 1. Login federado, do poker até voltar autenticado.
  await admin.goto("/");
  await capture(admin, "01-login-reinas-id");
  await requestLoginCode(admin, adminEmail);
  await capture(admin, "02-codigo-de-acesso");

  const emailHtml = await latestEmailHtml(request, adminEmail);
  expect(emailHtml).toContain("auth.magic_code");
  const emailPreview = await adminContext.newPage();
  await emailPreview.setViewportSize({ width: 900, height: 900 });
  await emailPreview.setContent(emailHtml, { waitUntil: "domcontentloaded" });
  await capture(emailPreview, "03-email-do-codigo");
  await emailPreview.close();

  await completeLoginCode(admin, request, adminEmail);
  await expect(admin).toHaveURL(/\/perfil/);
  await capture(admin, "04-primeiro-acesso");
  await admin.getByLabel("Como devemos chamar você?").fill("Admin Prints");
  await admin.getByRole("button", { name: "Continuar" }).click();
  await expect(admin).toHaveURL(/\/rooms$/, { timeout: 20_000 });
  await capture(admin, "05-minhas-salas-vazio");

  // 2. Tema.
  await admin.getByRole("button", { name: "Alternar tema" }).click();
  await capture(admin, "06-tema-claro");
  await admin.getByRole("button", { name: "Alternar tema" }).click();
  await capture(admin, "07-tema-escuro");

  // 3. Troca de nome, que vai até o reinas-id e volta.
  await admin.getByRole("button", { name: /Admin Prints/ }).click();
  await capture(admin, "08-menu-de-perfil");
  await admin.getByLabel("profile.name").fill("Admin Renomeado");
  await admin.getByRole("button", { name: "Trocar nome" }).click();
  await expect(
    admin.getByRole("button", { name: /Admin Renomeado/ }),
  ).toBeVisible();
  await capture(admin, "09-nome-atualizado");

  // 4. Criação da sala.
  await admin.getByRole("button", { name: "Criar sala" }).click();
  await expect(admin).toHaveURL(/\/rooms\/new$/);
  await capture(admin, "10-formulario-de-sala");
  await admin.getByLabel("Nome", { exact: true }).fill("Sala Prints");
  await admin.getByLabel("Link personalizado").fill(slug);
  await admin.getByLabel("Senha de 4 dígitos").fill("1234");
  await admin.getByLabel("Estilo de votação").selectOption("FIBONACCI");
  await capture(admin, "11-formulario-preenchido");
  await admin
    .locator("form")
    .getByRole("button", { name: "Criar sala" })
    .click();
  await expect(admin).toHaveURL(new RegExp(`/${slug}$`));
  await expect(admin.getByLabel("QR code da sala")).toBeVisible({
    timeout: 15_000,
  });
  await capture(admin, "12-sala-criada-e-compartilhamento");

  await admin.getByRole("button", { name: "Minhas salas" }).click();
  await expect(admin.getByText("Sala Prints")).toBeVisible();
  await capture(admin, "13-minhas-salas-com-sala");

  // 5. Entrada do participante, no celular.
  await loginNewUser(
    participant,
    request,
    participantEmail,
    "Participante Prints",
    `/${slug}`,
    `/${slug}`,
  );
  await capture(participant, "14-pedido-de-senha-mobile");
  await participant.getByLabel("Senha de 4 dígitos").fill("1234");
  await participant.getByRole("button", { name: "Entrar na sala" }).click();
  await expect(participant.getByLabel("Senha de 4 dígitos")).toHaveCount(0);
  await capture(participant, "15-sala-ingressada-mobile");

  // 6. Fila de tarefas e votação.
  await admin.getByText("Sala Prints").click();
  await expect(admin).toHaveURL(new RegExp(`/${slug}$`));
  await addTask(admin, "API observability", "https://example.com/observability");
  await addTask(admin, "Cache strategy", "https://example.com/cache");
  await capture(admin, "16-fila-de-tarefas");

  await participant.getByRole("button", { name: "8", exact: true }).click();
  await expect(
    participant.getByRole("button", { name: "8", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await capture(participant, "17-voto-selecionado-mobile");
  await expect(admin.getByText("Votou")).toBeVisible({ timeout: 15_000 });
  await capture(admin, "18-voto-ainda-oculto");
  await admin.getByRole("button", { name: "Revelar votos" }).click();
  await expect(admin.getByText("Votos revelados")).toBeVisible();
  await capture(admin, "19-votos-revelados");
  await admin.getByRole("button", { name: "Concluir: 8" }).click();
  await expect(
    admin.getByRole("heading", { name: "Cache strategy" }),
  ).toBeVisible();
  await capture(admin, "20-proxima-tarefa");

  // 7. Encerramento e resumo.
  await admin.getByRole("button", { name: "Finalizar sala" }).click();
  await expect(admin.getByText("Sala finalizada")).toBeVisible();
  await capture(admin, "21-resumo-desktop");
  await expect(participant.getByText("Sala finalizada")).toBeVisible({
    timeout: 20_000,
  });
  await capture(participant, "22-resumo-mobile");

  // 8. Retorno de quem já tem nome e logout federado.
  await loginExistingUser(returning, request, adminEmail);
  await capture(returning, "23-retorno-direto-para-salas");
  await returning.getByRole("button", { name: "Sair" }).click();
  await expect(returning).toHaveURL(/\/login/, { timeout: 20_000 });
  await capture(returning, "24-apos-sair");

  await adminContext.close();
  await participantContext.close();
  await returningContext.close();
});
