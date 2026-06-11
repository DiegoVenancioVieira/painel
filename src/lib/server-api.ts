// Helper server-side para chamar a API REST do Directus usando o token da
// sessão da operadora (cookie httpOnly), com refresh automático em caso de 401.
//
// Uso exclusivo em route handlers (pode ler/escrever cookies).

import { DIRECTUS_URL } from "./directus";
import {
  ACCESS_COOKIE,
  clearSessionCookies,
  getAccessToken,
  getRefreshToken,
  setSessionCookies,
} from "./session";
import { cookies } from "next/headers";

export class NaoAutenticado extends Error {
  constructor() {
    super("Não autenticado.");
    this.name = "NaoAutenticado";
  }
}

async function tentarRefresh(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch(`${DIRECTUS_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh, mode: "json" }),
    cache: "no-store",
  });
  if (!res.ok) {
    clearSessionCookies();
    return null;
  }
  const json = (await res.json()) as {
    data: { access_token: string; refresh_token: string; expires: number };
  };
  setSessionCookies({
    access_token: json.data.access_token,
    refresh_token: json.data.refresh_token,
    expires: json.data.expires,
  });
  return json.data.access_token;
}

/**
 * Faz uma requisição autenticada ao Directus. Tenta com o access token atual;
 * se expirar (401), renova via refresh token e repete uma vez.
 * Retorna o Response cru (para JSON ou stream binário).
 */
export async function directusFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  let token = getAccessToken();
  // Se não houver access mas houver refresh, renova antes.
  if (!token) {
    token = await tentarRefresh();
  }
  if (!token) throw new NaoAutenticado();

  const doFetch = (t: string) =>
    fetch(`${DIRECTUS_URL}${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${t}`,
      },
      cache: "no-store",
    });

  let res = await doFetch(token);
  if (res.status === 401) {
    const novo = await tentarRefresh();
    if (!novo) throw new NaoAutenticado();
    res = await doFetch(novo);
  }
  return res;
}

/** Conveniência: faz directusFetch e parseia JSON, lançando em erro != 2xx. */
export async function directusJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await directusFetch(path, init);
  if (res.status === 401) throw new NaoAutenticado();
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Directus ${res.status}: ${txt}`);
  }
  const json = (await res.json()) as { data: T };
  return json.data;
}

/** Id da operadora logada (via /users/me). */
export async function operadoraId(): Promise<string | null> {
  try {
    const me = await directusJson<{ id: string }>("/users/me?fields=id");
    return me.id;
  } catch {
    return null;
  }
}

/** Garante que o cookie de acesso ainda exista (após possível refresh). */
export function sessaoAtiva(): boolean {
  return Boolean(cookies().get(ACCESS_COOKIE) || getRefreshToken());
}
