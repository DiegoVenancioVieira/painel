import { NextRequest, NextResponse } from "next/server";
import { DIRECTUS_URL } from "@/lib/directus";
import { setSessionCookies } from "@/lib/session";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json(
      { error: "Informe e-mail e senha." },
      { status: 400 },
    );
  }

  // Autentica direto na API do Directus (modo JSON) para obter os tokens.
  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, mode: "json" }),
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "E-mail ou senha incorretos." },
      { status: 401 },
    );
  }

  const json = (await res.json()) as {
    data: { access_token: string; refresh_token: string; expires: number };
  };

  setSessionCookies({
    access_token: json.data.access_token,
    refresh_token: json.data.refresh_token,
    expires: json.data.expires,
  });

  return NextResponse.json({ ok: true });
}
