import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";

// Protege todas as rotas exceto /login e os endpoints de auth.
// Considera autenticada a sessão que tenha access OU refresh token
// (o refresh é renovado sob demanda pela aplicação).
export function middleware(req: NextRequest) {
  const hasSession =
    req.cookies.has(ACCESS_COOKIE) || req.cookies.has(REFRESH_COOKIE);

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Aplica a todas as rotas, exceto: login, api/auth, estáticos e favicon.
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico|sounds).*)"],
};
