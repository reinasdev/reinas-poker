import { describe, expect, it } from "vitest";
import { authenticatedBackPath, pathWithReturn, safeReturnPath } from "../navigation";

describe("safe return navigation", () => {
  it("accepts internal paths and preserves query strings", () => {
    expect(safeReturnPath("/sprint?tab=queue")).toBe("/sprint?tab=queue");
    expect(pathWithReturn("/verify", "/abc123")).toBe("/verify?next=%2Fabc123");
  });

  it.each([
    "https://evil.test",
    "//evil.test",
    "\\evil.test",
    "javascript:alert(1)",
  ])("rejects external destination %s", (destination) =>
    expect(safeReturnPath(destination)).toBe("/rooms"),
  );

  it("keeps back navigation inside the application", () => {
    expect(authenticatedBackPath("/abc123")).toBe("/rooms");
    expect(authenticatedBackPath("/rooms/new")).toBe("/rooms");
    expect(authenticatedBackPath("/rooms")).toBeNull();
  });
});
