import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/infrastructure/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://planning_poker:planning_poker@localhost:5432/planning_poker",
  },
  strict: true,
  verbose: true,
});
