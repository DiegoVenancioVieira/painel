import { NextRequest, NextResponse } from "next/server";
import { directusFetch, NaoAutenticado } from "@/lib/server-api";

// POST /api/alertas/[id]/despachar
// Cria um despacho (designa uma viatura ao alerta).
// Body: { viatura_id: string, observacao?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  let body: { viatura_id?: string; observacao?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.viatura_id) {
    return NextResponse.json({ error: "viatura_id é obrigatório." }, { status: 400 });
  }

  try {
    const res = await directusFetch("/items/despachos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alerta_id: params.id,
        viatura_id: body.viatura_id,
        status: "designada",
        observacao: body.observacao ?? null,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json(
        { error: "Não foi possível designar a viatura.", detalhe: txt },
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
