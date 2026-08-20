import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./client";

const MIGRATION_LOCK_ID = 451903642;

async function main() {
  await pool.query("select pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);

  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    console.info("Migrations applied successfully");
  } finally {
    await pool.query("select pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
  }
}

main()
  .catch(async (error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
