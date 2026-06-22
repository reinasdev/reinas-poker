import { beforeEach, describe, expect, it, vi } from "vitest";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { magicCodes, roomParticipants, rooms, sessions, tasks, users, votes, votingRounds } from "@/infrastructure/db/schema";
import { env } from "@/infrastructure/config/env";

const state = vi.hoisted(() => ({
  sent: [] as Array<{ email: string; code: string }>,
  values: new Map<string, string>(),
  options: undefined as Record<string, unknown> | undefined,
}));

vi.mock("@/infrastructure/email/mailer", () => ({
  sendMagicCode: async (email: string, code: string) => state.sent.push({ email, code }),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => state.values.has(name) ? { value: state.values.get(name) } : undefined,
    set: (name: string, value: string, options: Record<string, unknown>) => {
      state.values.set(name, value);
      state.options = options;
    },
    delete: (name: string) => state.values.delete(name),
  }),
}));

import { getCurrentUser, requestMagicCode, saveProfile, verifyMagicCode } from "../auth";

describe.skipIf(process.env.RUN_DB_TESTS !== "1")("magic-code authentication", () => {
  beforeEach(async () => {
    state.sent.length = 0;
    state.values.clear();
    state.options = undefined;
    await db.delete(votes);
    await db.delete(votingRounds);
    await db.delete(tasks);
    await db.delete(roomParticipants);
    await db.delete(rooms);
    await db.delete(sessions);
    await db.delete(magicCodes);
    await db.delete(users);
  });

  it("creates a hashed one-time code and an opaque cookie-backed session", async () => {
    await requestMagicCode(" Person@Example.com ");
    expect(state.sent).toHaveLength(1);
    const [{ codeHash }] = await db.select().from(magicCodes);
    expect(codeHash).not.toContain(state.sent[0].code);

    const user = await verifyMagicCode("person@example.com", state.sent[0].code);
    expect(user.name).toBeNull();
    expect(state.options).toMatchObject({ httpOnly: true, sameSite: "lax", secure: false, maxAge: 30 * 86400 });
    const [{ tokenHash }] = await db.select().from(sessions);
    expect(tokenHash).not.toBe(state.values.get(env.SESSION_COOKIE_NAME));
    await expect(verifyMagicCode("person@example.com", state.sent[0].code)).rejects.toMatchObject({ code: "INVALID_CODE" });
  });

  it("rejects expired codes and blocks after five invalid attempts", async () => {
    await requestMagicCode("expired@example.com");
    await db.update(magicCodes).set({ expiresAt: new Date(0) }).where(eq(magicCodes.email, "expired@example.com"));
    await expect(verifyMagicCode("expired@example.com", state.sent[0].code)).rejects.toMatchObject({ code: "INVALID_CODE" });

    await requestMagicCode("attempts@example.com");
    const wrongCode = state.sent[1].code === "000000" ? "000001" : "000000";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(verifyMagicCode("attempts@example.com", wrongCode)).rejects.toMatchObject({ code: "INVALID_CODE" });
    }
    const [record] = await db.select().from(magicCodes).where(eq(magicCodes.email, "attempts@example.com")).orderBy(desc(magicCodes.createdAt));
    expect(record.attempts).toBe(5);
    await expect(verifyMagicCode("attempts@example.com", state.sent[1].code)).rejects.toMatchObject({ code: "INVALID_CODE" });
  });

  it("reuses the persisted profile on later sessions", async () => {
    await requestMagicCode("profile@example.com");
    await verifyMagicCode("profile@example.com", state.sent[0].code);
    await saveProfile("Ada Lovelace");
    expect((await getCurrentUser())?.name).toBe("Ada Lovelace");

    await db.delete(sessions);
    state.values.clear();
    await db.delete(magicCodes).where(and(eq(magicCodes.email, "profile@example.com")));
    await requestMagicCode("profile@example.com");
    const existing = await verifyMagicCode("profile@example.com", state.sent[1].code);
    expect(existing.name).toBe("Ada Lovelace");
  });
});
