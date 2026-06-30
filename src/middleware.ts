import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";

// Protege todas as rotas exceto /login e os endpoints de auth.
// Considera autenticada a sessão que tenha access OU refresh token
// (o refresh é renovado sob demanda pela aplicação).
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Liberados da proteção de sessão:
  //  - /login e /api/auth/* (fluxo de autenticação);
  //  - demos Flutter Web servidos de /public (/mulher, /viatura);
  //  - qualquer arquivo estático (caminho com extensão: .png, .ico, .js, sons…).
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/mulher") ||
    pathname.startsWith("/viatura") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Endpoints dos apps móveis autenticam por token próprio (não por cookie de
  // sessão): viatura (login/ping) e app da usuária (/api/app/*).
  if (
    pathname === "/api/viaturas/login" ||
    /^\/api\/viaturas\/[^/]+\/ping$/.test(pathname) ||
    pathname.startsWith("/api/app/")
  ) {
    return NextResponse.next();
  }

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
  // Invoca o middleware em tudo, exceto os internos do Next. O allow-list acima
  // cuida de login, auth, demos e estáticos.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
