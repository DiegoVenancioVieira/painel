import { NextRequest, NextResponse } from "next/server";
import { directusFetch, NaoAutenticado } from "@/lib/server-api";
import type { StatusDespacho } from "@/types/schema";

const STATUS_VALIDOS: StatusDespacho[] = [
  "designada",
  "a_caminho",
  "no_local",
  "encerrada",
];

// PATCH /api/despachos/[id]  → atualiza status (e marca chegada em 'no_local')
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  let body: { status?: StatusDespacho };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.status || !STATUS_VALIDOS.includes(body.status)) {
    return NextResponse.json({ error: "status inválido." }, { status: 400 });
  }

  const payload: Record<string, unknown> = { status: body.status };
  if (body.status === "no_local") payload.data_chegada = new Date().toISOString();

  try {
    const res = await directusFetch(`/items/despachos/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Falha ao atualizar despacho." },
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
