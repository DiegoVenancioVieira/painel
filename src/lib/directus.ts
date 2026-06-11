// Clientes do Directus SDK.
//
// IMPORTANTE: o cliente com token admin (`getAdminClient`) só pode ser usado em
// código server-side (route handlers, server components, server actions). O token
// admin NUNCA deve chegar ao browser.

import {
  createDirectus,
  rest,
  staticToken,
  authentication,
  type AuthenticationClient,
  type DirectusClient,
  type RestClient,
} from "@directus/sdk";
import type { DirectusSchema } from "@/types/schema";

export const DIRECTUS_URL =
  process.env.NEXT_PUBLIC_DIRECTUS_URL ?? "http://192.168.0.118:8056";

type AdminClient = DirectusClient<DirectusSchema> & RestClient<DirectusSchema>;
type SessionClient = DirectusClient<DirectusSchema> &
  RestClient<DirectusSchema> &
  AuthenticationClient<DirectusSchema>;

/**
 * Cliente server-side autenticado com o token admin estático.
 * Use apenas em código que roda no servidor.
 */
export function getAdminClient(): AdminClient {
  const token = process.env.DIRECTUS_TOKEN;
  if (!token) {
    throw new Error(
      "DIRECTUS_TOKEN não definido. Configure-o em .env.local (uso server-side).",
    );
  }
  return createDirectus<DirectusSchema>(DIRECTUS_URL)
    .with(staticToken(token))
    .with(rest());
}

/**
 * Cria um cliente que autentica com um access_token específico (ex.: o token da
 * sessão da operadora, recuperado do cookie). Server-side.
 */
export function getTokenClient(accessToken: string): AdminClient {
  return createDirectus<DirectusSchema>(DIRECTUS_URL)
    .with(staticToken(accessToken))
    .with(rest());
}

/**
 * Cliente de autenticação (login/refresh/logout). Modo 'json' para gerenciarmos
 * os tokens manualmente e guardá-los em cookies httpOnly.
 */
export function getAuthClient(): SessionClient {
  return createDirectus<DirectusSchema>(DIRECTUS_URL)
    .with(authentication("json", { autoRefresh: false }))
    .with(rest());
}
