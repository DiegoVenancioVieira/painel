import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/directus";
import { readItem, deleteItem } from "@directus/sdk";
import { usuariaPorToken } from "@/lib/app-auth";
import type { Guardiao } from "@/types/schema";

// DELETE /api/app/guardioes/[id] — remove um guardião da própria usuária.
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const usuaria = await usuariaPorToken(req.headers.get("authorization"));
  if (!usuaria) {
    return NextResponse.json({ error: "Não autenticada." }, { status: 401 });
  }

  const admin = getAdminClient();
  // Garante que o guardião pertence à usuária antes de excluir.
  let g: Pick<Guardiao, "id" | "usuaria_id">;
  try {
    g = (await admin.request(
      readItem("guardioes", params.id, { fields: ["id", "usuaria_id"] }),
    )) as typeof g;
  } catch {
    return NextResponse.json({ error: "Guardião não encontrado." }, { status: 404 });
  }
  if (g.usuaria_id !== usuaria.id) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  await admin.request(deleteItem("guardioes", params.id));
  return NextResponse.json({ ok: true });
}
