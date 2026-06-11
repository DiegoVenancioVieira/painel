import { NextResponse } from "next/server";
import { DIRECTUS_URL } from "@/lib/directus";
import { clearSessionCookies, getRefreshToken } from "@/lib/session";

export async function POST() {
  const refresh = getRefreshToken();
  // Best-effort: invalida o refresh token no Directus.
  if (refresh) {
    try {
      await fetch(`${DIRECTUS_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh, mode: "json" }),
        cache: "no-store",
      });
    } catch {
      // ignora — limpamos os cookies de qualquer forma
    }
  }
  clearSessionCookies();
  return NextResponse.json({ ok: true });
}
