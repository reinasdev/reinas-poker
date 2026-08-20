import { env } from "@/infrastructure/config/env";
import { DomainError } from "@/domain/errors";

export type IdentityUser = {
  id: string;
  email: string;
  name: string | null;
};

type CacheEntry = { user: IdentityUser | null; expiresAt: number };

/**
 * Cache de introspecção por token. Evita uma ida ao reinas-id em cada
 * render de página ou chamada de API dentro da mesma janela.
 * O `globalThis` mantém o cache vivo entre recompilações em desenvolvimento.
 */
const globalCache = globalThis as unknown as {
  reinasIdSessions?: Map<string, CacheEntry>;
};
const cache = globalCache.reinasIdSessions ?? new Map<string, CacheEntry>();
globalCache.reinasIdSessions = cache;

const CACHE_LIMIT = 5_000;

function readCache(token: string) {
  const entry = cache.get(token);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(token);
    return undefined;
  }
  return entry;
}

function writeCache(token: string, user: IdentityUser | null) {
  if (env.SESSION_CACHE_SECONDS === 0) return;
  // Descarte simples do item mais antigo, suficiente para um cache de processo.
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(token, {
    user,
    expiresAt: Date.now() + env.SESSION_CACHE_SECONDS * 1000,
  });
}

export function forgetSession(token: string) {
  cache.delete(token);
}

export function rememberSession(token: string, user: IdentityUser) {
  writeCache(token, user);
}

async function callIdentity<T>(
  path: string,
  payload: Record<string, unknown>,
  method: "POST" | "PATCH" = "POST",
) {
  const response = await fetch(`${env.REINAS_ID_URL}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      ...payload,
      client_id: env.REINAS_ID_CLIENT_ID,
      client_secret: env.REINAS_ID_CLIENT_SECRET,
    }),
  });
  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string;
  };
  if (!response.ok)
    throw new DomainError(
      "IDENTITY_ERROR",
      data.message ?? "Falha ao falar com o reinas-id",
      response.status === 401 ? 401 : 502,
    );
  return data;
}

/** Valida o token de sessão, usando o cache quando ainda está quente. */
export async function introspectSession(
  token: string,
): Promise<IdentityUser | null> {
  const cached = readCache(token);
  if (cached) return cached.user;

  const data = await callIdentity<{ active: boolean; user?: IdentityUser }>(
    "/api/sessions/introspect",
    { token },
  );
  const user = data.active && data.user ? data.user : null;
  writeCache(token, user);
  return user;
}

/** Troca o código de autorização por um token de sessão desta aplicação. */
export async function exchangeCode(code: string, redirectUri: string) {
  const data = await callIdentity<{
    token: string;
    expires_at: string;
    user: IdentityUser;
  }>("/api/oauth/token", { code, redirect_uri: redirectUri });
  rememberSession(data.token, data.user);
  return data;
}

export async function revokeSession(token: string) {
  forgetSession(token);
  await callIdentity("/api/sessions/revoke", { token });
}

export async function updateIdentityName(token: string, name: string) {
  const data = await callIdentity<{ user: IdentityUser }>(
    "/api/users/me",
    { token, name },
    "PATCH",
  );
  rememberSession(token, data.user);
  return data.user;
}

/** URL do fluxo de login, para onde o navegador é enviado. */
export function authorizeUrl(state: string) {
  const url = new URL("/authorize", env.REINAS_ID_PUBLIC_URL);
  url.searchParams.set("client_id", env.REINAS_ID_CLIENT_ID);
  url.searchParams.set("redirect_uri", callbackUrl());
  url.searchParams.set("state", state);
  return url.toString();
}

export function callbackUrl() {
  return new URL("/auth/callback", env.APP_URL).toString();
}

/**
 * URL que encerra também a sessão no reinas-id. Sem passar por aqui, o
 * próximo redirecionamento reautenticaria o usuário em silêncio.
 */
export function logoutUrl(returnTo = "/") {
  const url = new URL("/logout", env.REINAS_ID_PUBLIC_URL);
  url.searchParams.set("client_id", env.REINAS_ID_CLIENT_ID);
  url.searchParams.set("return_to", new URL(returnTo, env.APP_URL).toString());
  return url.toString();
}
