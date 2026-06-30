// Autenticação do app da usuária por token próprio (Bearer), validado
// server-side com o token admin. Uso exclusivo em route handlers /api/app/*.

import { getAdminClient } from "./directus";
import { readItems } from "@directus/sdk";
import type { Usuaria } from "@/types/schema";

export function tokenDoHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
}

/**
 * Resolve a usuária a partir do token. Retorna null se inválido.
 */
export async function usuariaPorToken(
  authHeader: string | null,
): Promise<Pick<Usuaria, "id" | "nome" | "telefone" | "validada"> | null> {
  const token = tokenDoHeader(authHeader);
  if (!token) return null;

  const admin = getAdminClient();
  try {
    const itens = (await admin.request(
      readItems("usuarias", {
        filter: { token: { _eq: token } },
        fields: ["id", "nome", "telefone", "validada"],
        limit: 1,
      }),
    )) as Pick<Usuaria, "id" | "nome" | "telefone" | "validada">[];
    return itens[0] ?? null;
  } catch {
    return null;
  }
}
