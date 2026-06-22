import { describe,expect,it } from "vitest";import { hashPassword,keyedHash,magicCode,opaqueToken,verifyPassword } from "../crypto";
describe("security",()=>{
 it("creates a six digit code",()=>expect(magicCode()).toMatch(/^\d{6}$/));
 it("creates opaque tokens and deterministic hashes",()=>{const token=opaqueToken();expect(token.length).toBeGreaterThan(30);expect(keyedHash(token)).toBe(keyedHash(token));expect(keyedHash(token)).not.toContain(token)});
 it("hashes room passwords with argon2id",async()=>{const hash=await hashPassword("1234");expect(hash).toContain("argon2id");expect(await verifyPassword(hash,"1234")).toBe(true);expect(await verifyPassword(hash,"9999")).toBe(false)});
});
