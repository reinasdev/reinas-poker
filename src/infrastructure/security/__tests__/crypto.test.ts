import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../crypto";

describe("segurança de salas", () => {
  it("gera hash argon2id e valida a senha da sala", async () => {
    const hash = await hashPassword("1234");
    expect(hash).toContain("argon2id");
    expect(await verifyPassword(hash, "1234")).toBe(true);
    expect(await verifyPassword(hash, "9999")).toBe(false);
  });

  it("gera hashes diferentes para a mesma senha", async () => {
    const [first, second] = await Promise.all([
      hashPassword("1234"),
      hashPassword("1234"),
    ]);
    expect(first).not.toBe(second);
  });
});
