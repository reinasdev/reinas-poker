import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./client";

async function main() {
  await migrate(db, { migrationsFolder: "drizzle" });
  await pool.end();
  console.info("Migrations applied successfully");
}

main().catch(async (error: unknown) => {
  console.error(error);
  await pool.end();
  process.exitCode = 1;
});
