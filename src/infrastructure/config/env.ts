import { z } from "zod";

const schema=z.object({
  NODE_ENV:z.enum(["development","test","production"]).default("development"),
  DATABASE_URL:z.string().url().default("postgresql://planning_poker:planning_poker@localhost:5432/planning_poker"),
  APP_URL:z.string().url().default("http://localhost:3000"),
  SESSION_COOKIE_NAME:z.string().default("planning_poker_session"),
  AUTH_HASH_SECRET:z.string().min(32).default("development-secret-change-me-32-chars"),
  SMTP_HOST:z.string().default("localhost"), SMTP_PORT:z.coerce.number().int().default(1025),
  SMTP_FROM:z.string().default("Planning Poker <no-reply@planning-poker.local>"),
  MAGIC_CODE_TTL_MINUTES:z.coerce.number().int().default(10), MAGIC_CODE_COOLDOWN_SECONDS:z.coerce.number().int().default(60),
  MAGIC_CODE_MAX_ATTEMPTS:z.coerce.number().int().default(5), SESSION_TTL_DAYS:z.coerce.number().int().default(30)
});
export const env=schema.parse(process.env);
