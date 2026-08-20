import { expect, type APIRequestContext, type Page } from "@playwright/test";
import path from "node:path";
import { waitForHydration } from "./hydration";

export const mailpitUrl = process.env.MAILPIT_URL ?? "http://127.0.0.1:8025";
export const pokerUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
export const identityUrl =
  process.env.PLAYWRIGHT_IDENTITY_URL ?? "http://localhost:3001";

/** Todos os prints ficam num único lugar, fora das pastas de cada app. */
export const screenshotRoot = path.resolve(
  __dirname,
  "../../test-results/screenshots",
);

export async function settle(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);
}

export async function capture(page: Page, name: string) {
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
    path: path.join(screenshotRoot, `${name}.png`),
    fullPage: true,
  });
}

export async function clearMailpit(request: APIRequestContext) {
  await request.delete(`${mailpitUrl}/api/v1/messages`).catch(() => undefined);
}

type MailpitMessage = { To: Array<{ Address: string }>; Snippet: string };

async function findMessage(request: APIRequestContext, email: string) {
  const response = await request.get(`${mailpitUrl}/api/v1/messages`);
  const body = (await response.json()) as { messages: MailpitMessage[] };
  return body.messages.find((message) =>
    message.To.some((recipient) => recipient.Address === email),
  );
}

export async function magicCode(request: APIRequestContext, email: string) {
  await expect
    .poll(
      async () => (await findMessage(request, email))?.Snippet.match(/\b\d{6}\b/)?.[0],
      { timeout: 15_000 },
    )
    .toMatch(/^\d{6}$/);
  return (await findMessage(request, email))!.Snippet.match(/\b\d{6}\b/)![0];
}

export async function latestEmailHtml(
  request: APIRequestContext,
  email: string,
) {
  const response = await request.get(`${mailpitUrl}/api/v1/messages`);
  const body = (await response.json()) as {
    messages: Array<
      MailpitMessage & { ID?: string; Id?: string; id?: string }
    >;
  };
  const message = body.messages.find((item) =>
    item.To.some((recipient) => recipient.Address === email),
  );
  if (!message) throw new Error(`Email não encontrado para ${email}`);
  const id = message.ID ?? message.Id ?? message.id;
  if (!id) throw new Error("Mailpit não devolveu o id da mensagem");
  const detail = (await (
    await request.get(`${mailpitUrl}/api/v1/message/${id}`)
  ).json()) as { HTML?: string; Html?: string; html?: string; Text?: string };
  return (
    detail.HTML ??
    detail.Html ??
    detail.html ??
    `<pre>${detail.Text ?? message.Snippet}</pre>`
  );
}

/** Da tela do reinas-id: pede o código por email. */
export async function requestLoginCode(page: Page, email: string) {
  await expect(page).toHaveURL(new RegExp(`${identityUrl}/login`));
  await waitForHydration(page);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("button", { name: "Enviar código" }).click();
  await expect(page).toHaveURL(/\/verify/, { timeout: 15_000 });
  await settle(page);
}

export async function completeLoginCode(
  page: Page,
  request: APIRequestContext,
  email: string,
) {
  await waitForHydration(page);
  await page
    .getByRole("textbox", { name: "Código de acesso" })
    .fill(await magicCode(request, email));
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

const escapePath = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Percorre o fluxo inteiro: poker → reinas-id → código → perfil → poker.
 */
export async function loginNewUser(
  page: Page,
  request: APIRequestContext,
  email: string,
  name: string,
  startPath = "/",
  expectedPath = "/rooms",
) {
  await page.goto(startPath);
  await requestLoginCode(page, email);
  await completeLoginCode(page, request, email);
  await expect(page).toHaveURL(/\/perfil/, { timeout: 15_000 });
  await waitForHydration(page);
  await page.getByLabel("Como devemos chamar você?").fill(name);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(
    new RegExp(`${escapePath(pokerUrl)}${escapePath(expectedPath)}$`),
    { timeout: 20_000 },
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
  await requestLoginCode(page, email);
  await completeLoginCode(page, request, email);
  await expect(page).toHaveURL(
    new RegExp(`${escapePath(pokerUrl)}${escapePath(expectedPath)}$`),
    { timeout: 20_000 },
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
  await waitForHydration(page);
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByLabel("Link personalizado").fill(slug);
  await page.getByLabel("Senha de 4 dígitos").fill(password);
  await page.getByLabel("Estilo de votação").selectOption(style);
  await page
    .locator("form")
    .getByRole("button", { name: "Criar sala" })
    .click();
  await expect(page).toHaveURL(new RegExp(`/${slug}$`));
  await settle(page);
}

export async function addTask(page: Page, title: string, link: string) {
  await waitForHydration(page);
  await page.getByPlaceholder("Título da tarefa").fill(title);
  await page.getByPlaceholder("https://...").fill(link);
  await page.getByRole("button", { name: "Adicionar tarefa" }).click();
  await expect(page.getByText(title).first()).toBeVisible({ timeout: 10_000 });
}
