import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("versioned initial migration", () => {
  const migration = readFileSync(
    resolve("drizzle/0000_initial_schema.sql"),
    "utf8",
  );
  const journal = JSON.parse(
    readFileSync(resolve("drizzle/meta/_journal.json"), "utf8"),
  ) as {
    entries: Array<{ idx: number; tag: string }>;
  };

  it("creates every persisted aggregate", () => {
    for (const table of [
      "users",
      "magic_codes",
      "sessions",
      "rooms",
      "room_participants",
      "tasks",
      "voting_rounds",
      "votes",
    ]) {
      expect(migration).toContain(`CREATE TABLE \"${table}\"`);
    }
  });

  it("contains enums, indexes, foreign keys and uniqueness constraints", () => {
    for (const enumName of [
      "room_status",
      "round_status",
      "task_status",
      "voting_style",
    ]) {
      expect(migration).toContain(`CREATE TYPE \"public\".\"${enumName}\"`);
    }
    expect(migration).toContain("rooms_slug_lower_unique");
    expect(migration).toContain("votes_round_participant_unique");
    expect(migration).toContain("FOREIGN KEY");
  });

  it("keeps ordered Drizzle metadata for every SQL migration", () => {
    expect(journal.entries.map(({ idx, tag }) => ({ idx, tag }))).toEqual([
      { idx: 0, tag: "0000_initial_schema" },
      { idx: 1, tag: "0001_lucky_marrow" },
    ]);
  });

  it("does not use drizzle-kit push in project automation", () => {
    const packageJson = readFileSync(resolve("package.json"), "utf8");
    const workflow = readFileSync(resolve(".github/workflows/ci.yml"), "utf8");
    expect(`${packageJson}\n${workflow}`).not.toContain("drizzle-kit push");
  });
});
