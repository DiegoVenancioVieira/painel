import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/directus";
import { readItem, updateItem, createItem } from "@directus/sdk";
import type { Viatura } from "@/types/schema";

// POST /api/viaturas/[id]/ping
// Ingestão de posição GPS enviada pelo app/PWA do motorista.
//
// Auth: header `Authorization: Bearer <token-da-viatura>` — o token é o campo
// secreto `token` da própria viatura (não o token admin). O endpoint valida e
// escreve no Directus usando o token admin server-side, que nunca chega ao app.
//
// Body JSON: { latitude, longitude, velocidade?, direcao? }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Token ausente." }, { status: 401 });
  }

  let body: {
    latitude?: number;
    longitude?: number;
    velocidade?: number;
    direcao?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { latitude, longitude, velocidade, direcao } = body;
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json(
      { error: "latitude e longitude (number) são obrigatórios." },
      { status: 400 },
    );
  }

  const admin = getAdminClient();

  // Valida o token contra a viatura
  let viatura: Pick<Viatura, "id" | "token" | "ativa">;
  try {
    viatura = (await admin.request(
      readItem("viaturas", params.id, { fields: ["id", "token", "ativa"] }),
    )) as typeof viatura;
  } catch {
    return NextResponse.json({ error: "Viatura não encontrada." }, { status: 404 });
  }

  if (!viatura.token || viatura.token !== token) {
    return NextResponse.json({ error: "Token inválido." }, { status: 403 });
  }

  const agora = new Date().toISOString();
  try {
    // Atualiza última posição (desnormalizada) + registra ponto no rastro
    await admin.request(
      updateItem("viaturas", params.id, {
        ultima_lat: latitude,
        ultima_lng: longitude,
        ultima_velocidade: velocidade ?? null,
        ultima_direcao: direcao ?? null,
        ultimo_ping: agora,
      }),
    );
    await admin.request(
      createItem("viatura_posicoes", {
        viatura_id: params.id,
        latitude,
        longitude,
        velocidade: velocidade ?? null,
        direcao: direcao ?? null,
      }),
    );
  } catch {
    return NextResponse.json({ error: "Falha ao registrar posição." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ts: agora });
}
