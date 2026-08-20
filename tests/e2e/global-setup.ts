import { identityUrl, mailpitUrl } from "./helpers";

/** Em dev o Next compila a rota na primeira visita, o que leva alguns segundos. */
async function reachable(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    return response.status < 500;
  } catch {
    return false;
  }
}

/**
 * O login atravessa o reinas-id, que vive em outro repositório. Falhar aqui,
 * com instrução, é melhor do que ver dezenas de testes estourarem por timeout.
 */
export default async function globalSetup() {
  const faltando: string[] = [];
  if (!(await reachable(`${identityUrl}/api/health`)))
    faltando.push(`reinas-id em ${identityUrl}`);
  if (!(await reachable(`${mailpitUrl}/api/v1/messages`)))
    faltando.push(`Mailpit em ${mailpitUrl}`);

  if (faltando.length)
    throw new Error(
      [
        `Serviço(s) indisponível(is): ${faltando.join(", ")}.`,
        "",
        "O E2E do Planning Poker precisa do reinas-id rodando, porque o login",
        "acontece lá e os códigos de acesso chegam no Mailpit dele.",
        "",
        "No repositório https://github.com/reinasdev/reinas-id:",
        "  make infra && npm run db:migrate && npm run dev",
        "",
        "Ou aponte para instâncias já rodando com PLAYWRIGHT_IDENTITY_URL e MAILPIT_URL.",
      ].join("\n"),
    );
}
