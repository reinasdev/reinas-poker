import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { profileIncomplete, unauthenticated } from "@/domain/errors";
import { nameSchema } from "@/domain/validation";
import { env } from "@/infrastructure/config/env";
import { db } from "@/infrastructure/db/client";
import { users } from "@/infrastructure/db/schema";
import {
  authorizeUrl,
  callbackUrl,
  exchangeCode,
  forgetSession,
  introspectSession,
  logoutUrl,
  revokeSession,
  updateIdentityName,
  type IdentityUser,
} from "@/infrastructure/identity/reinas-id";

export type SessionUser = IdentityUser;

/** Janela em que o espelho local é considerado fresco o bastante. */
const MIRROR_TTL_MS = 5 * 60_000;
const mirrorTouchedAt = new Map<string, number>();

/**
 * Mantém o espelho local em dia. As salas fazem JOIN em `users` para exibir
 * nomes, então o espelho precisa existir — mas basta reescrevê-lo de tempos
 * em tempos, não a cada requisição.
 */
async function syncMirror(user: IdentityUser) {
  const last = mirrorTouchedAt.get(user.id);
  if (last && Date.now() - last < MIRROR_TTL_MS) return;

  await db
    .insert(users)
    .values({ id: user.id, email: user.email, name: user.name })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: user.email,
        name: user.name,
        syncedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  mirrorTouchedAt.set(user.id, Date.now());
}

async function sessionToken() {
  return (await cookies()).get(env.SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await sessionToken();
  if (!token) return null;

  let user: IdentityUser | null = null;
  try {
    user = await introspectSession(token);
  } catch {
    // reinas-id fora do ar: trata como visitante em vez de derrubar a página.
    return null;
  }
  if (!user) return null;

  await syncMirror(user);
  return user;
}

export async function requireUser({
  complete = true,
}: { complete?: boolean } = {}) {
  const user = await getCurrentUser();
  if (!user) throw unauthenticated();
  if (complete && !user.name) throw profileIncomplete();
  return user;
}

/**
 * Conclui o retorno do reinas-id: troca o código e prepara o espelho local.
 * Quem grava o cookie é o Route Handler, já que o Next só permite alterar
 * cookies fora do render de uma página.
 */
export async function completeLogin(code: string) {
  const result = await exchangeCode(code, callbackUrl());
  await syncMirror(result.user);
  return {
    token: result.token,
    expiresAt: new Date(result.expires_at),
    user: result.user,
  };
}

/** URL para onde mandar quem ainda não está autenticado. */
export function loginUrl(returnPath: string) {
  return authorizeUrl(returnPath);
}

export async function saveProfile(rawName: string) {
  const token = await sessionToken();
  if (!token) throw unauthenticated();
  const name = nameSchema.parse(rawName);

  const user = await updateIdentityName(token, name);
  mirrorTouchedAt.delete(user.id);
  await syncMirror(user);
  return user;
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(env.SESSION_COOKIE_NAME)?.value;
  if (token) {
    forgetSession(token);
    try {
      await revokeSession(token);
    } catch {
      // A sessão local já será descartada; revogar é o melhor esforço.
    }
  }
  jar.delete(env.SESSION_COOKIE_NAME);
}

/** Usado pelos testes de integração para não vazar estado entre casos. */
export function resetMirrorCache() {
  mirrorTouchedAt.clear();
}

/** Garante o espelho para um usuário conhecido (usado em testes e no callback). */
export async function ensureMirrored(user: IdentityUser) {
  mirrorTouchedAt.delete(user.id);
  await syncMirror(user);
}

export async function findMirroredUser(id: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return row ?? null;
}

export async function findMirroredByEmail(email: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email})=${email.toLowerCase()}`)
    .limit(1);
  return row ?? null;
}

/** Destino que encerra a sessão federada no reinas-id. */
export function logoutRedirectUrl(returnTo = "/") {
  return logoutUrl(returnTo);
}
