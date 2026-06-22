import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/infrastructure/config/env";
import * as schema from "./schema";

const globalDb=globalThis as unknown as {pool?:Pool};
export const pool=globalDb.pool ?? new Pool({connectionString:env.DATABASE_URL,max:10});
if(env.NODE_ENV!=="production") globalDb.pool=pool;
export const db=drizzle(pool,{schema});
