import { NextResponse } from "next/server";
import { completeLogin, loginUrl } from "@/application/auth";
import { safeReturnPath } from "@/domain/navigation";
import { env } from "@/infrastructure/config/env";

/**
 * Retorno do reinas-id: troca o código por uma sessão e segue para o destino.
 * É Route Handler porque gravar cookie durante o render de uma página não é
 * permitido no Next.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const destination = safeReturnPath(params.get("state"));
  const code = params.get("code");

  if (!code) return NextResponse.redirect(loginUrl(destination));

  try {
    const session = await completeLogin(code);
    const response = NextResponse.redirect(new URL(destination, env.APP_URL));
    response.cookies.set(env.SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
      expires: session.expiresAt,
    });
    return response;
  } catch {
    return NextResponse.redirect(
      new URL(
        `/auth/erro?next=${encodeURIComponent(destination)}`,
        env.APP_URL,
      ),
    );
  }
}
