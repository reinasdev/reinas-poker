import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";

export const dynamic = "force-dynamic";

/** Usado pelo healthcheck do container. */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "degraded" }, { status: 503 });
  }
}
