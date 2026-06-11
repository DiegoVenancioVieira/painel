import { NextResponse } from "next/server";
import { directusFetch, NaoAutenticado } from "@/lib/server-api";
import type { Viatura } from "@/types/schema";

// GET /api/viaturas
// Retorna as viaturas ativas com a última posição conhecida (para o mapa).
export async function GET() {
  const qs = new URLSearchParams();
  qs.set(
    "fields",
    "id,identificador,tipo,placa,telefone_contato,ativa,ultima_lat,ultima_lng,ultima_velocidade,ultima_direcao,ultimo_ping",
  );
  qs.set("filter[ativa][_eq]", "true");
  qs.set("limit", "-1");

  try {
    const res = await directusFetch(`/items/viaturas?${qs.toString()}`);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Falha ao buscar viaturas." },
        { status: res.status },
      );
    }
    const json = (await res.json()) as { data: Viatura[] };
    return NextResponse.json({ data: json.data });
  } catch (e) {
    if (e instanceof NaoAutenticado) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
