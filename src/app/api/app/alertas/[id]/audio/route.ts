import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, DIRECTUS_URL } from "@/lib/directus";
import { readItem, updateItem } from "@directus/sdk";
import { usuariaPorToken } from "@/lib/app-auth";
import type { Alerta } from "@/types/schema";

// POST /api/app/alertas/[id]/audio — upload do áudio do incidente (multipart).
// Campo do arquivo: "file". Sobe para directus_files e vincula em alertas.audio.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const usuaria = await usuariaPorToken(req.headers.get("authorization"));
  if (!usuaria) {
    return NextResponse.json({ error: "Não autenticada." }, { status: 401 });
  }

  const admin = getAdminClient();
  // Confirma posse do alerta.
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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Multipart inválido." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Arquivo 'file' ausente." }, { status: 400 });
  }

  // Sobe para o Directus usando o token admin (server-side).
  const token = process.env.DIRECTUS_TOKEN!;
  const nome =
    (file as File).name || `alerta-${params.id}-${Date.now()}.m4a`;
  const upload = new FormData();
  upload.append("file", file, nome);

  const up = await fetch(`${DIRECTUS_URL}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: upload,
  });
  if (!up.ok) {
    return NextResponse.json(
      { error: "Falha no upload do áudio." },
      { status: 502 },
    );
  }
  const fileJson = (await up.json()) as { data: { id: string } };

  await admin.request(updateItem("alertas", params.id, { audio: fileJson.data.id }));

  return NextResponse.json({ ok: true, audio: fileJson.data.id });
}
