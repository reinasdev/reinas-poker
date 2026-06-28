import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const mailpitUrl = process.env.MAILPIT_URL ?? "http://127.0.0.1:8025";

export async function settle(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(750);
}

export async function clearMailpit(request: APIRequestContext) {
  await request.delete(`${mailpitUrl}/api/v1/messages`).catch(() => undefined);
}

export async function magicCode(request: APIRequestContext, email: string) {
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

export async function latestEmailHtml(
  request: APIRequestContext,
  email: string,
) {
  const response = await request.get(`${mailpitUrl}/api/v1/messages`);
  const body = (await response.json()) as {
    messages: Array<{
      ID?: string;
      Id?: string;
      id?: string;
      To: Array<{ Address: string }>;
      Snippet: string;
    }>;
  };
  const message = body.messages.find((item) =>
    item.To.some((recipient) => recipient.Address === email),
  );
  if (!message) throw new Error(`Email not found for ${email}`);
  const id = message.ID ?? message.Id ?? message.id;
  if (!id) throw new Error("Mailpit message id not found");
  const detailResponse = await request.get(
    `${mailpitUrl}/api/v1/message/${id}`,
  );
  const detail = (await detailResponse.json()) as {
    HTML?: string;
    Html?: string;
    html?: string;
    Text?: string;
  };
  return (
    detail.HTML ??
    detail.Html ??
    detail.html ??
    `<pre>${detail.Text ?? message.Snippet}</pre>`
  );
}

export async function requestLoginCode(page: Page, email: string) {
  await settle(page);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("button", { name: "Enviar código" }).click();
  try {
    await expect(page).toHaveURL(/\/verify/, { timeout: 5_000 });
  } catch (error) {
    if (!(await page.getByText("Muitas tentativas. Aguarde.").isVisible())) {
      throw error;
    }
    await page.waitForTimeout(61_000);
    await page.getByRole("button", { name: "Enviar código" }).click();
    await expect(page).toHaveURL(/\/verify/);
  }
  await settle(page);
}

export async function completeLoginCode(
  page: Page,
  request: APIRequestContext,
  email: string,
) {
  await settle(page);
  await page
    .getByRole("textbox", { name: "Código mágico" })
    .fill(await magicCode(request, email));
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

export async function loginNewUser(
  page: Page,
  request: APIRequestContext,
  email: string,
  name: string,
  startPath = "/",
  expectedPath = "/rooms",
) {
  await page.goto(startPath);
  await settle(page);
  await requestLoginCode(page, email);
  await completeLoginCode(page, request, email);
  await expect(page).toHaveURL(/\/onboarding/);
  await settle(page);
  await page.getByLabel("Como devemos chamar você?").fill(name);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(
    new RegExp(`${expectedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
  );
}

export async function loginExistingUser(
  page: Page,
  request: APIRequestContext,
  email: string,
  startPath = "/",
  expectedPath = "/rooms",
) {
  await page.goto(startPath);
  await settle(page);
  await requestLoginCode(page, email);
  await completeLoginCode(page, request, email);
  await expect(page).toHaveURL(
    new RegExp(`${expectedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
  );
}

export async function createRoom(
  page: Page,
  {
    name,
    slug,
    password = "1234",
    style = "FIBONACCI",
  }: { name: string; slug: string; password?: string; style?: string },
) {
  await settle(page);
  await page.getByRole("button", { name: "Criar sala" }).click();
  await expect(page).toHaveURL(/\/rooms\/new$/);
  await settle(page);
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("Link personalizado").fill(slug);
  await page.getByLabel("Senha de 4 dígitos").fill(password);
  await page.getByLabel("Estilo de votação").selectOption(style);
  await settle(page);
  await page
    .locator("form")
    .getByRole("button", { name: "Criar sala" })
    .click();
  await expect(page).toHaveURL(new RegExp(`/${slug}$`));
  await settle(page);
}

export async function addTask(page: Page, title: string, link: string) {
  await settle(page);
  await page.getByPlaceholder("Título da tarefa").fill(title);
  await page.getByPlaceholder("https://...").fill(link);
  await page.getByRole("button", { name: "Adicionar tarefa" }).click();
  await expect(page.getByText(title).first()).toBeVisible({ timeout: 10_000 });
}
