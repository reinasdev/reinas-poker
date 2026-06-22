import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { env } from "@/infrastructure/config/env";

const databaseNames = ["planning_poker_migration_empty", "planning_poker_migration_upgrade"] as const;

function databaseUrl(name: string) {
  const url = new URL(env.DATABASE_URL);
  url.pathname = `/${name}`;
  return url.toString();
}

async function recreateDatabases() {
  const admin = new Pool({ connectionString: env.DATABASE_URL });
  for (const name of databaseNames) {
    await admin.query("select pg_terminate_backend(pid) from pg_stat_activity where datname = $1", [name]);
    await admin.query(`drop database if exists ${name}`);
    await admin.query(`create database ${name}`);
  }
  await admin.end();
}

async function migrateDatabase(url: string, folder: string) {
  const pool = new Pool({ connectionString: url });
  await migrate(drizzle(pool), { migrationsFolder: folder });
  const tables = await pool.query("select count(*)::int as count from pg_tables where schemaname = 'public'");
  const history = await pool.query("select count(*)::int as count from drizzle.__drizzle_migrations");
  await pool.end();
  return { tables: tables.rows[0].count as number, migrations: history.rows[0].count as number };
}

async function main() {
  await recreateDatabases();
  const migrationRoot = resolve("drizzle");
  const sqlFiles = (await readdir(migrationRoot)).filter(file => file.endsWith(".sql")).sort();
  if (!sqlFiles.length) throw new Error("No versioned migrations found");

  const empty = await migrateDatabase(databaseUrl(databaseNames[0]), migrationRoot);
  if (empty.tables !== 8 || empty.migrations !== sqlFiles.length) throw new Error("Empty database migration validation failed");

  const upgradeUrl = databaseUrl(databaseNames[1]);
  if (sqlFiles.length > 1) {
    const previousRoot = resolve(".tmp-migrations-previous");
    await rm(previousRoot, { recursive: true, force: true });
    await mkdir(resolve(previousRoot, "meta"), { recursive: true });
    const journal = JSON.parse(await readFile(resolve(migrationRoot, "meta/_journal.json"), "utf8")) as { entries: unknown[] };
    journal.entries = journal.entries.slice(0, -1);
    await writeFile(resolve(previousRoot, "meta/_journal.json"), JSON.stringify(journal));
    for (const file of sqlFiles.slice(0, -1)) await cp(resolve(migrationRoot, file), resolve(previousRoot, file));
    await migrateDatabase(upgradeUrl, previousRoot);
    await rm(previousRoot, { recursive: true, force: true });
  }
  const upgraded = await migrateDatabase(upgradeUrl, migrationRoot);
  if (upgraded.tables !== 8 || upgraded.migrations !== sqlFiles.length) throw new Error("Previous-version upgrade validation failed");
  console.info(`Validated ${sqlFiles.length} migration(s) on empty and previous-version databases`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Migration validation failed");
  process.exitCode = 1;
});
