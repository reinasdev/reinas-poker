import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/application/auth";
import { roomProjection } from "@/application/rooms";
import { apiError } from "@/app/api/_shared";

export const dynamic = "force-dynamic";

/**
 * Devolve 304 quando a projeção não mudou desde a última leitura do cliente,
 * evitando transferir e re-renderizar a sala inteira a cada evento.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const projection = await roomProjection((await params).id, user.id);
    const body = JSON.stringify(projection);
    const etag = `"${createHash("sha1").update(body).digest("base64url")}"`;

    if (request.headers.get("if-none-match") === etag)
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, "Cache-Control": "no-store" },
      });

    return new NextResponse(body, {
      headers: {
        "content-type": "application/json",
        ETag: etag,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
