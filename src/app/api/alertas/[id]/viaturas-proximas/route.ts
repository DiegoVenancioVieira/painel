import { NextRequest, NextResponse } from "next/server";
import { directusJson, NaoAutenticado } from "@/lib/server-api";
import { haversineMetros } from "@/lib/geo";
import type { Alerta, Viatura } from "@/types/schema";

// GET /api/alertas/[id]/viaturas-proximas
// Retorna as viaturas ativas ordenadas pela distância até o alerta.
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const alerta = await directusJson<Alerta>(
      `/items/alertas/${params.id}?fields=id,latitude_inicial,longitude_inicial`,
    );

    const viaturas = await directusJson<Viatura[]>(
      "/items/viaturas?filter[ativa][_eq]=true&fields=id,identificador,tipo,placa,telefone_contato,ultima_lat,ultima_lng,ultimo_ping&limit=-1",
    );

    const lat = alerta.latitude_inicial;
    const lng = alerta.longitude_inicial;

    const comDistancia = viaturas
      .map((v) => {
        const distancia =
          lat != null && lng != null && v.ultima_lat != null && v.ultima_lng != null
            ? haversineMetros(lat, lng, v.ultima_lat, v.ultima_lng)
            : null;
        return { ...v, distancia };
      })
      .sort((a, b) => {
        if (a.distancia == null) return 1;
        if (b.distancia == null) return -1;
        return a.distancia - b.distancia;
      });

    return NextResponse.json({ data: comDistancia });
  } catch (e) {
    if (e instanceof NaoAutenticado) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
