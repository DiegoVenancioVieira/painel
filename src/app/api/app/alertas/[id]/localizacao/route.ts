import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/directus";
import { readItem, createItem } from "@directus/sdk";
import { usuariaPorToken } from "@/lib/app-auth";
import type { Alerta } from "@/types/schema";

// POST /api/app/alertas/[id]/localizacao — acrescenta um ponto ao rastro.
// Body: { latitude, longitude }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const usuaria = await usuariaPorToken(req.headers.get("authorization"));
  if (!usuaria) {
    return NextResponse.json({ error: "Não autenticada." }, { status: 401 });
  }

  let body: { latitude?: number; longitude?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (typeof body.latitude !== "number" || typeof body.longitude !== "number") {
    return NextResponse.json(
      { error: "latitude e longitude (number) são obrigatórios." },
      { status: 400 },
    );
  }

  const admin = getAdminClient();
  // Confirma que o alerta pertence à usuária.
  let alerta: Pick<Alerta, "id" | "usuaria_id">;
  try {
    alerta = (await admin.request(
      readItem("alertas", params.id, { fields: ["id", "usuaria_id"] }),
    )) as typeof alerta;
  } catch {
    return NextResponse.json({ error: "Alerta não encontrado." }, { status: 404 });
  }
  if (alerta.usuaria_id !== usuaria.id) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  await admin.request(
    createItem("localizacoes_alerta", {
      alerta_id: params.id,
      latitude: body.latitude,
      longitude: body.longitude,
    }),
  );
  return NextResponse.json({ ok: true });
}
