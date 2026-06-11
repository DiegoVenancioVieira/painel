// Gerenciamento da sessão da operadora via cookies httpOnly.
// Server-side apenas.

import { cookies } from "next/headers";

export const ACCESS_COOKIE = "sos_access";
export const REFRESH_COOKIE = "sos_refresh";

export interface SessionTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch ms
}

const baseCookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setSessionCookies(tokens: {
  access_token: string;
  refresh_token: string;
  expires: number | null; // ms de validade do access_token
}) {
  const store = cookies();
  const expiresAt = Date.now() + (tokens.expires ?? 15 * 60 * 1000);

  store.set(ACCESS_COOKIE, tokens.access_token, {
    ...baseCookieOptions,
    maxAge: Math.floor((tokens.expires ?? 15 * 60 * 1000) / 1000),
  });
  store.set(
    REFRESH_COOKIE,
    JSON.stringify({ refresh_token: tokens.refresh_token, expires_at: expiresAt }),
    {
      ...baseCookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    },
  );
}

export function clearSessionCookies() {
  const store = cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export function getAccessToken(): string | null {
  return cookies().get(ACCESS_COOKIE)?.value ?? null;
}

export function getRefreshToken(): string | null {
  const raw = cookies().get(REFRESH_COOKIE)?.value;
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as { refresh_token: string }).refresh_token;
  } catch {
    return null;
  }
}
