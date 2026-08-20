import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  nameSchema,
  roomPasswordSchema,
  slugSchema,
  taskTitleSchema,
  taskUrlSchema,
} from "../validation";

describe("validação de domínio", () => {
  it("normaliza o nome exibido", () =>
    expect(nameSchema.parse(" Reinaldo ")).toBe("Reinaldo"));

  it.each(["abcdefg", "bad_slug", "á"])("recusa slug inválido %s", (value) =>
    expect(() => slugSchema.parse(value)).toThrow(),
  );

  it("normaliza slug para minúsculas", () =>
    expect(slugSchema.parse(" SP01 ")).toBe("sp01"));

  it.each(["123", "12345", "abcd"])(
    "recusa senha de sala inválida %s",
    (value) => expect(() => roomPasswordSchema.parse(value)).toThrow(),
  );

  it("valida o link da tarefa", () => {
    expect(taskUrlSchema.parse("https://example.com/task/1")).toContain(
      "example.com",
    );
    expect(() => taskUrlSchema.parse("not-a-url")).toThrow();
  });

  it("recusa título de tarefa vazio", () =>
    expect(() => taskTitleSchema.parse("   ")).toThrow());

  it("valida o payload de criação de sala", () =>
    expect(
      createRoomSchema.parse({
        name: "Sprint",
        slug: "sp01",
        password: "1234",
        style: "SCRUM",
      }).style,
    ).toBe("SCRUM"));
});
