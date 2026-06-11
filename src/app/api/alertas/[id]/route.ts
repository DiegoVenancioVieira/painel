import { NextRequest, NextResponse } from "next/server";
import { directusFetch, directusJson, NaoAutenticado } from "@/lib/server-api";
import type { Alerta, Guardiao, LocalizacaoAlerta } from "@/types/schema";

// GET /api/alertas/[id]
// Retorna o alerta + usuária + guardiões da usuária + rastro de localização.
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const alertaQs = new URLSearchParams();
    alertaQs.set(
      "fields",
      "*,usuaria_id.id,usuaria_id.nome,usuaria_id.telefone,usuaria_id.validada,usuaria_id.data_criacao",
    );
    const alerta = await directusJson<Alerta>(
      `/items/alertas/${params.id}?${alertaQs.toString()}`,
    );

    const usuaria = alerta.usuaria_id;
    const usuariaId =
      usuaria && typeof usuaria === "object" ? usuaria.id : usuaria;

    // Guardiões da usuária
    let guardioes: Guardiao[] = [];
    if (usuariaId) {
      const gQs = new URLSearchParams();
      gQs.set("filter[usuaria_id][_eq]", String(usuariaId));
      gQs.set("fields", "id,nome,telefone");
      guardioes = await directusJson<Guardiao[]>(
        `/items/guardioes?${gQs.toString()}`,
      );
    }

    // Rastro de localização
    const locQs = new URLSearchParams();
    locQs.set("filter[alerta_id][_eq]", params.id);
    locQs.set("sort", "data_hora");
    locQs.set("limit", "-1");
    locQs.set("fields", "id,latitude,longitude,data_hora");
    const localizacoes = await directusJson<LocalizacaoAlerta[]>(
      `/items/localizacoes_alerta?${locQs.toString()}`,
    );

    return NextResponse.json({ alerta, guardioes, localizacoes });
  } catch (e) {
    if (e instanceof NaoAutenticado) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    // Diferencia "não encontrado"
    const msg = e instanceof Error ? e.message : "Erro";
    if (msg.includes("403") || msg.includes("404")) {
      return NextResponse.json(
        { error: "Alerta não encontrado." },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
