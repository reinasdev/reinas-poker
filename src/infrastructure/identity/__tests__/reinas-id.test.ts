import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  authorizeUrl,
  callbackUrl,
  exchangeCode,
  forgetSession,
  introspectSession,
  revokeSession,
} from "../reinas-id";
import { env } from "@/infrastructure/config/env";

type FetchCall = { url: string; method: string; body: Record<string, unknown> };

function stubFetch(
  responder: (call: FetchCall) => { status?: number; body: unknown },
) {
  const calls: FetchCall[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const call: FetchCall = {
        url: String(url),
        method: init.method ?? "GET",
        body: JSON.parse(String(init.body ?? "{}")),
      };
      calls.push(call);
      const { status = 200, body } = responder(call);
      return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      });
    }),
  );
  return calls;
}

const USER = { id: "11111111-1111-4111-8111-111111111111", email: "a@b.test", name: "Ada" };

describe("cliente do reinas-id", () => {
  beforeEach(() => {
    forgetSession("token-a");
    forgetSession("token-b");
  });

  afterEach(() => vi.unstubAllGlobals());

  it("envia as credenciais da aplicação em toda chamada", async () => {
    const calls = stubFetch(() => ({ body: { active: true, user: USER } }));
    await introspectSession("token-a");

    expect(calls[0].url).toBe(`${env.REINAS_ID_URL}/api/sessions/introspect`);
    expect(calls[0].method).toBe("POST");
    expect(calls[0].body).toMatchObject({
      token: "token-a",
      client_id: env.REINAS_ID_CLIENT_ID,
      client_secret: env.REINAS_ID_CLIENT_SECRET,
    });
  });

  it("reaproveita o cache dentro da janela configurada", async () => {
    const calls = stubFetch(() => ({ body: { active: true, user: USER } }));

    const first = await introspectSession("token-a");
    const second = await introspectSession("token-a");

    expect(first).toEqual(USER);
    expect(second).toEqual(USER);
    expect(calls).toHaveLength(1);
  });

  it("também memoriza a resposta negativa, sem repetir a chamada", async () => {
    const calls = stubFetch(() => ({ body: { active: false } }));

    expect(await introspectSession("token-b")).toBeNull();
    expect(await introspectSession("token-b")).toBeNull();
    expect(calls).toHaveLength(1);
  });

  it("esquece a sessão ao revogar, forçando nova consulta", async () => {
    const calls = stubFetch((call) =>
      call.url.endsWith("/revoke")
        ? { body: { ok: true } }
        : { body: { active: true, user: USER } },
    );

    await introspectSession("token-a");
    await revokeSession("token-a");
    await introspectSession("token-a");

    expect(calls.filter((c) => c.url.endsWith("/introspect"))).toHaveLength(2);
  });

  it("aquece o cache com o usuário devolvido na troca do código", async () => {
    const calls = stubFetch(() => ({
      body: {
        token: "token-a",
        expires_at: new Date(Date.now() + 86_400_000).toISOString(),
        user: USER,
      },
    }));

    await exchangeCode("code-123", callbackUrl());
    expect(await introspectSession("token-a")).toEqual(USER);
    expect(calls.filter((c) => c.url.endsWith("/introspect"))).toHaveLength(0);
  });

  it("converte falha do reinas-id em erro de domínio", async () => {
    stubFetch(() => ({ status: 400, body: { message: "Código inválido" } }));
    await expect(exchangeCode("expirado", callbackUrl())).rejects.toMatchObject(
      { code: "IDENTITY_ERROR", message: "Código inválido" },
    );
  });

  it("monta a URL de autorização com client, callback e destino", () => {
    const url = new URL(authorizeUrl("/sp01"));
    expect(url.pathname).toBe("/authorize");
    expect(url.searchParams.get("client_id")).toBe(env.REINAS_ID_CLIENT_ID);
    expect(url.searchParams.get("redirect_uri")).toBe(callbackUrl());
    expect(url.searchParams.get("state")).toBe("/sp01");
  });
});
