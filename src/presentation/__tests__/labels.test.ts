import { describe, expect, it } from "vitest";
import { taskStatusLabel } from "../labels";

describe("presentation labels", () => {
  it("localizes every task state", () => {
    expect(taskStatusLabel("PENDING")).toBe("Pendente");
    expect(taskStatusLabel("VOTING")).toBe("Em votação");
    expect(taskStatusLabel("COMPLETED")).toBe("Concluída");
  });
});
