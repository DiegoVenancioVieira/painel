import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/directus";
import { readItems, createItem } from "@directus/sdk";
import { usuariaPorToken } from "@/lib/app-auth";
import type { Guardiao } from "@/types/schema";

// GET /api/app/guardioes — lista os guardiões da usuária autenticada.
export async function GET(req: NextRequest) {
  const usuaria = await usuariaPorToken(req.headers.get("authorization"));
  if (!usuaria) {
    return NextResponse.json({ error: "Não autenticada." }, { status: 401 });
  }
  const admin = getAdminClient();
  const data = (await admin.request(
    readItems("guardioes", {
      filter: { usuaria_id: { _eq: usuaria.id } },
      fields: ["id", "nome", "telefone"],
      sort: ["nome"],
      limit: -1,
    }),
  )) as Guardiao[];
  return NextResponse.json({ data });
}

// POST /api/app/guardioes — cria um guardião. Body: { nome, telefone }
export async function POST(req: NextRequest) {
  const usuaria = await usuariaPorToken(req.headers.get("authorization"));
  if (!usuaria) {
    return NextResponse.json({ error: "Não autenticada." }, { status: 401 });
  }
  let body: { nome?: string; telefone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const nome = body.nome?.trim();
  const telefone = body.telefone?.trim();
  if (!nome || !telefone) {
    return NextResponse.json({ error: "Informe nome e telefone." }, { status: 400 });
  }

  const admin = getAdminClient();
  const criado = (await admin.request(
    createItem("guardioes", { usuaria_id: usuaria.id, nome, telefone }),
  )) as Guardiao;
  return NextResponse.json({ data: criado });
}
