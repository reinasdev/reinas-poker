import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

const mailpitUrl = process.env.MAILPIT_URL ?? "http://127.0.0.1:8025";
test.setTimeout(120_000);

async function magicCode(request: APIRequestContext, email: string) {
  await expect
    .poll(
      async () => {
        const response = await request.get(`${mailpitUrl}/api/v1/messages`);
        const body = (await response.json()) as {
          messages: Array<{ To: Array<{ Address: string }>; Snippet: string }>;
        };
        return body.messages
          .find((message) =>
            message.To.some((recipient) => recipient.Address === email),
          )
          ?.Snippet.match(/\b\d{6}\b/)?.[0];
      },
      { timeout: 15_000 },
    )
    .toMatch(/^\d{6}$/);
  const response = await request.get(`${mailpitUrl}/api/v1/messages`);
  const body = (await response.json()) as {
    messages: Array<{ To: Array<{ Address: string }>; Snippet: string }>;
  };
  return body.messages
    .find((message) =>
      message.To.some((recipient) => recipient.Address === email),
    )!
    .Snippet.match(/\b\d{6}\b/)![0];
}

async function login(
  page: Page,
  request: APIRequestContext,
  email: string,
  name: string,
  startPath = "/",
  expectedPath = "/rooms",
) {
  await page.goto(startPath);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Enviar código" }).click();
  await expect(page).toHaveURL(/\/verify/);
  await page.getByLabel("Código mágico").fill(await magicCode(request, email));
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel("Como devemos chamar você?").fill(name);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(
    new RegExp(`${expectedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
  );
}

test("fluxo completo persiste, sincroniza por SSE e finaliza somente leitura", async ({
  browser,
  request,
}) => {
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6);
  const slug = suffix.toLowerCase();
  const adminContext = await browser.newContext();
  const participantContext = await browser.newContext();
  const admin = await adminContext.newPage();
  const participant = await participantContext.newPage();

  await login(admin, request, `admin-${suffix}@example.test`, "Admin E2E");
  await expect(
    admin.getByRole("navigation", { name: "Navegação principal" }),
  ).toBeVisible();
  await admin
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("button", { name: "Criar sala" })
    .click();
  await admin.getByLabel("Nome").fill("Sprint E2E");
  await admin.getByLabel("Link personalizado").fill(slug);
  await admin.getByLabel("Senha de 4 dígitos").fill("1234");
  await admin.getByLabel("Estilo de votação").selectOption("FIBONACCI");
  await admin
    .locator("form")
    .getByRole("button", { name: "Criar sala" })
    .click();
  await expect(admin).toHaveURL(new RegExp(`/${slug}$`));

  await login(
    participant,
    request,
    `participant-${suffix}@example.test`,
    "Participant E2E",
    `/${slug}`,
    `/${slug}`,
  );
  await participant.getByLabel("Senha de 4 dígitos").fill("1234");
  await participant.getByRole("button", { name: "Entrar na sala" }).click();
  await expect(
    participant.getByRole("heading", { name: "Sprint E2E" }),
  ).toBeVisible();

  for (const [title, link] of [
    ["Issue One", "https://example.com/one"],
    ["Issue Two", "https://example.com/two"],
  ]) {
    await admin.getByPlaceholder("Título da tarefa").fill(title);
    await admin.getByPlaceholder("https://...").fill(link);
    await admin.getByRole("button", { name: "Adicionar tarefa" }).click();
  }
  await expect(admin.getByText("Em votação", { exact: true })).toBeVisible();
  await expect(admin.getByText("Pendente", { exact: true })).toBeVisible();
  await expect(admin.getByText(/PENDING|VOTING|COMPLETED/)).toHaveCount(0);
  await expect(
    participant.getByRole("heading", { name: "Issue One" }),
  ).toBeVisible();
  await participant.getByRole("button", { name: "8", exact: true }).click();
  await expect(admin.getByText("Votou")).toBeVisible();
  await expect(
    admin.getByText("Participant E2E").locator(".."),
  ).not.toContainText("8");
  await admin.getByRole("button", { name: "Revelar votos" }).click();
  await expect(
    participant.getByText("Participant E2E").locator(".."),
  ).toContainText("8");
  await admin.getByRole("button", { name: "Reiniciar" }).click();
  await participant.getByRole("button", { name: "13", exact: true }).click();
  await admin.getByRole("button", { name: "Revelar votos" }).click();
  await admin.getByRole("button", { name: "Concluir: 13" }).click();
  await expect(
    participant.getByRole("heading", { name: "Issue Two" }),
  ).toBeVisible();
  await admin.getByRole("button", { name: "Finalizar sala" }).click();
  await expect(admin.getByText("Sala finalizada")).toBeVisible();
  await expect(participant.getByText("Sala finalizada")).toBeVisible();
  await expect(participant.getByText("Resumo somente leitura")).toBeVisible();
  await expect(admin.getByText("Resumo somente leitura")).toBeVisible();
  await expect(admin.getByText("Issue One")).toBeVisible();
  await expect(admin.getByText("Issue Two")).toBeVisible();
  await expect(admin.getByText("Concluída", { exact: true })).toHaveCount(2);
  await expect(
    admin.getByRole("button", { name: /Revelar|Finalizar|Adicionar/ }),
  ).toHaveCount(0);
  await expect(
    participant.getByRole("button", { name: "Voltar" }),
  ).toBeVisible();
  await expect(
    participant.getByRole("button", { name: "Minhas salas" }),
  ).toBeVisible();
  await expect(
    participant.getByRole("button", { name: "Criar sala" }),
  ).toBeVisible();
  await participant.getByRole("button", { name: "Voltar" }).click();
  await expect(participant).toHaveURL(/\/rooms$/);
  await admin.getByRole("button", { name: "Sair" }).click();
  await expect(admin).toHaveURL(/\/$/);

  expect(
    await admin.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await adminContext.close();
  await participantContext.close();
});
