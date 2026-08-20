import { describe, expect, it } from "vitest";
import { authenticatedBackPath, safeReturnPath } from "../navigation";

describe("navegação de retorno segura", () => {
  it("aceita caminhos internos e preserva a query string", () => {
    expect(safeReturnPath("/sprint?tab=queue")).toBe("/sprint?tab=queue");
    expect(safeReturnPath("/abc123")).toBe("/abc123");
  });

  it.each([
    "https://evil.test",
    "//evil.test",
    "\evil.test",
    "javascript:alert(1)",
    "",
    undefined,
  ])("recusa destino externo %s", (destination) =>
    expect(safeReturnPath(destination)).toBe("/rooms"),
  );

  it("mantém a navegação de volta dentro da aplicação", () => {
    expect(authenticatedBackPath("/abc123")).toBe("/rooms");
    expect(authenticatedBackPath("/rooms/new")).toBe("/rooms");
    expect(authenticatedBackPath("/rooms")).toBeNull();
  });
});
