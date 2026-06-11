import { NextResponse } from "next/server";
import { DIRECTUS_URL } from "@/lib/directus";
import {
  clearSessionCookies,
  getRefreshToken,
  setSessionCookies,
} from "@/lib/session";

// Renova o access_token usando o refresh_token armazenado no cookie.
export async function POST() {
  const refresh = getRefreshToken();
  if (!refresh) {
    return NextResponse.json({ error: "Sem sessão." }, { status: 401 });
  }

  const res = await fetch(`${DIRECTUS_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh, mode: "json" }),
    cache: "no-store",
  });

  if (!res.ok) {
    clearSessionCookies();
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
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
