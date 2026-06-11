import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/directus";
import { readItems } from "@directus/sdk";
import type { Viatura } from "@/types/schema";

// POST /api/viaturas/login
// Usado pelo app do motorista: valida identificador + token e devolve o id (UUID)
// da viatura para os pings subsequentes. Não retorna o token.
//
// Body: { identificador: string, token: string }
export async function POST(req: NextRequest) {
  let body: { identificador?: string; token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const identificador = body.identificador?.trim();
  const token = body.token?.trim();
  if (!identificador || !token) {
    return NextResponse.json(
      { error: "Informe identificador e token." },
      { status: 400 },
    );
  }

  const admin = getAdminClient();
  let viaturas: Pick<Viatura, "id" | "identificador" | "tipo" | "token" | "ativa">[];
  try {
    viaturas = (await admin.request(
      readItems("viaturas", {
        filter: { identificador: { _eq: identificador } },
        fields: ["id", "identificador", "tipo", "token", "ativa"],
        limit: 1,
      }),
    )) as typeof viaturas;
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }

  const v = viaturas[0];
  if (!v || !v.token || v.token !== token) {
    return NextResponse.json(
      { error: "Identificador ou token inválido." },
      { status: 401 },
    );
  }
  if (!v.ativa) {
    return NextResponse.json({ error: "Viatura inativa." }, { status: 403 });
  }

  return NextResponse.json({
    id: v.id,
    identificador: v.identificador,
    tipo: v.tipo,
  });
}
