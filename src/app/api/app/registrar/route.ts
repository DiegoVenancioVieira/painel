import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/directus";
import { createItem, readItems, updateItem } from "@directus/sdk";
import { randomBytes } from "crypto";
import type { Usuaria } from "@/types/schema";

const novoToken = () => "utk_" + randomBytes(18).toString("base64url");

// POST /api/app/registrar
// Cadastro da usuária pelo app. Body: { nome, telefone }
// Cria (ou reaproveita) a usuária e retorna um token de acesso.
export async function POST(req: NextRequest) {
  let body: { nome?: string; telefone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const nome = body.nome?.trim();
  const telefone = body.telefone?.trim();
  if (!nome || !telefone) {
    return NextResponse.json(
      { error: "Informe nome e telefone." },
      { status: 400 },
    );
  }

  const admin = getAdminClient();
  try {
    // Reaproveita usuária existente com o mesmo telefone (gera token se faltar)
    const existentes = (await admin.request(
      readItems("usuarias", {
        filter: { telefone: { _eq: telefone } },
        fields: ["id", "nome", "token"],
        limit: 1,
      }),
    )) as Pick<Usuaria, "id" | "nome" | "token">[];

    if (existentes[0]) {
      const u = existentes[0];
      let token = u.token;
      if (!token) {
        token = novoToken();
        await admin.request(updateItem("usuarias", u.id, { token }));
      }
      return NextResponse.json({ id: u.id, nome: u.nome, token });
    }

    const token = novoToken();
    const criada = (await admin.request(
      createItem("usuarias", {
        nome,
        telefone,
        validada: false,
        token,
      }),
    )) as Pick<Usuaria, "id" | "nome">;

    return NextResponse.json({ id: criada.id, nome: criada.nome, token });
  } catch {
    return NextResponse.json({ error: "Erro ao registrar." }, { status: 500 });
  }
}
