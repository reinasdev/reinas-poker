import { NextResponse } from "next/server";
import { logout, logoutRedirectUrl } from "@/application/auth";
import { apiError, assertSameOrigin } from "@/app/api/_shared";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await logout();
    // O navegador precisa passar pelo reinas-id para encerrar a sessão lá também.
    return NextResponse.json({ ok: true, redirectTo: logoutRedirectUrl() });
  } catch (e) {
    return apiError(e);
  }
}
