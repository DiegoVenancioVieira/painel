import { NextRequest, NextResponse } from "next/server";
import {
  directusFetch,
  NaoAutenticado,
  operadoraId,
} from "@/lib/server-api";

// POST /api/alertas/[id]/resolver
// Marca o alerta como resolvido, registrando quem resolveu e quando.
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const quem = await operadoraId();
    const payload: Record<string, unknown> = {
      status: "resolvido",
      data_resolucao: new Date().toISOString(),
    };
    if (quem) payload.resolvido_por = quem;

    const res = await directusFetch(`/items/alertas/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json(
        { error: "Não foi possível resolver o alerta.", detalhe: txt },
        { status: res.status },
      );
    }

    const json = (await res.json()) as { data: unknown };
    return NextResponse.json({ ok: true, data: json.data });
  } catch (e) {
    if (e instanceof NaoAutenticado) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
