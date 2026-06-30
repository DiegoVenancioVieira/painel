import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/directus";
import { createItem } from "@directus/sdk";
import { usuariaPorToken } from "@/lib/app-auth";
import type { Alerta } from "@/types/schema";

// POST /api/app/alertas — dispara um alerta de pânico.
// Body: { latitude?, longitude?, sincronizado_offline?, data_criacao? }
export async function POST(req: NextRequest) {
  const usuaria = await usuariaPorToken(req.headers.get("authorization"));
  if (!usuaria) {
    return NextResponse.json({ error: "Não autenticada." }, { status: 401 });
  }

  let body: {
    latitude?: number;
    longitude?: number;
    sincronizado_offline?: boolean;
    data_criacao?: string;
  };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const admin = getAdminClient();
  const payload: Record<string, unknown> = {
    usuaria_id: usuaria.id,
    status: "ativo",
    latitude_inicial: body.latitude ?? null,
    longitude_inicial: body.longitude ?? null,
    sincronizado_offline: body.sincronizado_offline ?? false,
  };
  // Permite registrar a hora real do disparo quando sincronizado offline.
  if (body.data_criacao) payload.data_criacao = body.data_criacao;

  try {
    const criado = (await admin.request(
      createItem("alertas", payload),
    )) as Pick<Alerta, "id">;
    return NextResponse.json({ id: criado.id });
  } catch {
    return NextResponse.json({ error: "Erro ao criar alerta." }, { status: 500 });
  }
}
