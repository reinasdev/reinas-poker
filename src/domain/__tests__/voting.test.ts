import { describe, expect, it } from "vitest";
import { DECKS, isValidVote } from "../voting";
import { sanitizeVotes } from "../projection";
describe("voting domain", () => {
  it("defines the specified decks", () => {
    expect(DECKS.FIBONACCI).toContain("21");
    expect(DECKS.SCRUM).toContain("1/2");
    expect(DECKS.TSHIRT).toContain("XG");
  });
  it("rejects a card from another deck", () =>
    expect(isValidVote("FIBONACCI", "XG")).toBe(false));
  it("hides vote values while open", () =>
    expect(
      sanitizeVotes("OPEN", [{ participantId: "p1", value: "13" }]),
    ).toEqual([{ participantId: "p1" }]));
  it("reveals vote values after reveal", () =>
    expect(
      sanitizeVotes("REVEALED", [{ participantId: "p1", value: "13" }]),
    ).toEqual([{ participantId: "p1", value: "13" }]));
});
