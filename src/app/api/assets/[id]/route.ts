import { NextRequest, NextResponse } from "next/server";
import { DIRECTUS_URL } from "@/lib/directus";
import { sessaoAtiva } from "@/lib/server-api";

// GET /api/assets/[id]
// Faz proxy de um arquivo do Directus (ex.: áudio do alerta), usando o token
// admin server-side. Exige sessão de operadora ativa. O token admin nunca
// chega ao browser.
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!sessaoAtiva()) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const token = process.env.DIRECTUS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "DIRECTUS_TOKEN não configurado." },
      { status: 500 },
    );
  }

  const range = req.headers.get("range");
  const upstream = await fetch(`${DIRECTUS_URL}/assets/${params.id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(range ? { Range: range } : {}),
    },
    cache: "no-store",
  });

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json(
      { error: "Arquivo não encontrado." },
      { status: upstream.status },
    );
  }

  const headers = new Headers();
  for (const h of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "cache-control",
    "content-disposition",
  ]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
