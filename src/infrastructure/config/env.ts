import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z
    .string()
    .url()
    .default(
      "postgresql://reinas_poker:reinas_poker@localhost:5432/reinas_poker",
    ),
  APP_URL: z.string().url().default("http://localhost:3000"),
  SESSION_COOKIE_NAME: z.string().default("reinas_poker_session"),

  /** URL usada pelo servidor — na rede interna do compose. */
  REINAS_ID_URL: z.string().url().default("http://localhost:3001"),
  /** URL para onde o navegador é redirecionado; cai para REINAS_ID_URL. */
  REINAS_ID_PUBLIC_URL: z.string().url().optional(),
  REINAS_ID_CLIENT_ID: z.string().default("reinas-poker"),
  REINAS_ID_CLIENT_SECRET: z
    .string()
    .min(16)
    .default("development-client-secret-change-me"),
  /** Janela de cache da introspecção de sessão, em segundos. */
  SESSION_CACHE_SECONDS: z.coerce.number().int().min(0).default(60),
});

const parsed = schema.parse(process.env);

export const env = {
  ...parsed,
  REINAS_ID_PUBLIC_URL: parsed.REINAS_ID_PUBLIC_URL ?? parsed.REINAS_ID_URL,
};
