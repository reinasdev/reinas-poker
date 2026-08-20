import { NextResponse } from "next/server";
import { saveProfile } from "@/application/auth";
import { apiError, assertSameOrigin } from "@/app/api/_shared";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { name } = await request.json();
    const user = await saveProfile(name);
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    return apiError(e);
  }
}
