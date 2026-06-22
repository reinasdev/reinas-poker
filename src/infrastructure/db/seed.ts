import { pool } from "./client";
// Optional local data belongs here. Schema creation always belongs to migrations.
async function main() {
  console.info("No development seed configured");
  await pool.end();
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "Seed failed");
  await pool.end();
  process.exitCode = 1;
});
