import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/directus";
import { readItem, readItems } from "@directus/sdk";
import type { Viatura } from "@/types/schema";

// GET /api/viaturas/[id]/despacho-ativo
// Usado pelo app do motorista: com o token da própria viatura, retorna o
// despacho ativo (não encerrado) e a localização da mulher que acionou o
// alerta — para o app exibir o destino / abrir a navegação.
//
// Auth: header `Authorization: Bearer <token-da-viatura>` (mesmo esquema do
// endpoint de ping). O token nunca é o admin; a leitura no Directus usa o
// token admin server-side, que não chega ao app.
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Token ausente." }, { status: 401 });
  }

  const admin = getAdminClient();

  // Valida o token contra a viatura
  let viatura: Pick<Viatura, "id" | "token" | "ativa">;
  try {
    viatura = (await admin.request(
      readItem("viaturas", params.id, { fields: ["id", "token", "ativa"] }),
    )) as typeof viatura;
  } catch {
    return NextResponse.json(
      { error: "Viatura não encontrada." },
      { status: 404 },
    );
  }
  if (!viatura.token || viatura.token !== token) {
    return NextResponse.json({ error: "Token inválido." }, { status: 403 });
  }

  // Despacho ativo mais recente da viatura (não encerrado), já trazendo o alerta.
  let despachos: Array<{
    id: string;
    status: string;
    alerta_id: {
      id: string;
      status: string;
      latitude_inicial: number | null;
      longitude_inicial: number | null;
    } | null;
  }>;
  try {
    despachos = (await admin.request(
      readItems("despachos", {
        filter: {
          viatura_id: { _eq: params.id },
          status: { _neq: "encerrada" },
        },
        fields: [
          "id",
          "status",
          "alerta_id.id",
          "alerta_id.status",
          "alerta_id.latitude_inicial",
          "alerta_id.longitude_inicial",
        ],
        sort: ["-data_designacao"],
        limit: 1,
      }),
    )) as typeof despachos;
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }

  const d = despachos[0];
  if (!d || !d.alerta_id) {
    // Sem chamado ativo para esta viatura.
    return NextResponse.json({ despacho: null });
  }

  const alerta = d.alerta_id;

  // Última posição conhecida da mulher (rastro); fallback: posição inicial.
  let latitude = alerta.latitude_inicial;
  let longitude = alerta.longitude_inicial;
  let atualizadoEm: string | null = null;
  try {
    const locs = (await admin.request(
      readItems("localizacoes_alerta", {
        filter: { alerta_id: { _eq: alerta.id } },
        fields: ["latitude", "longitude", "data_hora"],
        sort: ["-data_hora"],
        limit: 1,
      }),
    )) as Array<{ latitude: number; longitude: number; data_hora: string }>;
    if (locs[0]) {
      latitude = locs[0].latitude;
      longitude = locs[0].longitude;
      atualizadoEm = locs[0].data_hora;
    }
  } catch {
    // sem rastro registrado — mantém a posição inicial do alerta
  }

  return NextResponse.json({
    despacho: { id: d.id, status: d.status },
    alerta: { id: alerta.id, status: alerta.status },
    localizacao:
      latitude != null && longitude != null
        ? { latitude, longitude, atualizadoEm }
        : null,
  });
}
