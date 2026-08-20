import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function projectFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = resolve(dir, entry);
    if (statSync(path).isDirectory()) return projectFiles(path);
    return path;
  });
}

const readMigration = (file: string) =>
  readFileSync(resolve("drizzle", file), "utf8");

describe("migrations versionadas", () => {
  const initial = readMigration("0000_initial_schema.sql");
  const mirror = readMigration("0002_users_mirror_reinas_id.sql");
  const journal = JSON.parse(
    readFileSync(resolve("drizzle/meta/_journal.json"), "utf8"),
  ) as { entries: Array<{ idx: number; tag: string }> };

  it("cria todos os agregados persistidos pelo poker", () => {
    for (const table of [
      "users",
      "rooms",
      "room_participants",
      "tasks",
      "voting_rounds",
      "votes",
    ])
      expect(initial).toContain(`CREATE TABLE \"${table}\"`);
  });

  it("mantém enums, índices, chaves estrangeiras e unicidade", () => {
    for (const enumName of [
      "room_status",
      "round_status",
      "task_status",
      "voting_style",
    ])
      expect(initial).toContain(`CREATE TYPE \"public\".\"${enumName}\"`);
    expect(initial).toContain("rooms_slug_lower_unique");
    expect(initial).toContain("votes_round_participant_unique");
    expect(initial).toContain("FOREIGN KEY");
  });

  it("entrega a autenticação ao reinas-id na migration do espelho", () => {
    expect(mirror).toContain('DROP TABLE "magic_codes"');
    expect(mirror).toContain('DROP TABLE "sessions"');
    // Sem default: o id de usuário passa a vir sempre do reinas-id.
    expect(mirror).toContain('ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT');
    expect(mirror).toContain('ADD COLUMN "synced_at"');
  });

  it("guarda os metadados do Drizzle em ordem", () => {
    expect(journal.entries.map(({ idx, tag }) => ({ idx, tag }))).toEqual([
      { idx: 0, tag: "0000_initial_schema" },
      { idx: 1, tag: "0001_lucky_marrow" },
      { idx: 2, tag: "0002_users_mirror_reinas_id" },
    ]);
  });

  it("não usa drizzle-kit push na automação do projeto", () => {
    const packageJson = readFileSync(resolve("package.json"), "utf8");
    const workflow = readFileSync(resolve(".github/workflows/ci.yml"), "utf8");
    expect(`${packageJson}\n${workflow}`).not.toContain("drizzle-kit push");
  });

  it("mantém migrations fora dos entrypoints da aplicação", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve("package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts.dev).not.toContain("db:migrate");
    expect(packageJson.scripts.start).not.toContain("db:migrate");
    expect(packageJson.scripts.build).not.toContain("db:migrate");
    expect(packageJson.scripts["build:deploy"]).toContain("db:migrate");

    const runtimeFiles = projectFiles(resolve("src")).filter(
      (file) =>
        !file.endsWith(resolve("src/infrastructure/db/migrate.ts")) &&
        !file.endsWith(resolve("src/infrastructure/db/validate-migrations.ts")) &&
        !file.includes(`${resolve("src/infrastructure/db/__tests__")}`) &&
        !file.endsWith(".test.ts") &&
        !file.endsWith(".test.tsx"),
    );
    const runtimeSource = runtimeFiles
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(runtimeSource).not.toContain("drizzle-orm/node-postgres/migrator");
    expect(runtimeSource).not.toContain("migrationsFolder");
  });
});
