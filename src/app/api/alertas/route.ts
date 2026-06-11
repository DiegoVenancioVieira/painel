import { NextRequest, NextResponse } from "next/server";
import { directusFetch, NaoAutenticado } from "@/lib/server-api";
import type { Alerta } from "@/types/schema";

// GET /api/alertas?status=ativo&limit=25&page=1
// Lista alertas com dados da usuária embutidos.
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status"); // ativo|resolvido|teste|todos
  const limit = req.nextUrl.searchParams.get("limit") ?? "25";
  const page = req.nextUrl.searchParams.get("page") ?? "1";

  const qs = new URLSearchParams();
  qs.set("fields", "*,usuaria_id.id,usuaria_id.nome,usuaria_id.telefone,usuaria_id.validada");
  qs.set("sort", "-data_criacao");
  qs.set("limit", limit);
  qs.set("page", page);
  qs.set("meta", "filter_count");
  if (status && status !== "todos") {
    qs.set("filter[status][_eq]", status);
  }

  try {
    const res = await directusFetch(`/items/alertas?${qs.toString()}`);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Falha ao buscar alertas." },
        { status: res.status },
      );
    }
    const json = (await res.json()) as {
      data: Alerta[];
      meta?: { filter_count?: number };
    };
    return NextResponse.json({
      data: json.data,
      total: json.meta?.filter_count ?? json.data.length,
    });
  } catch (e) {
    if (e instanceof NaoAutenticado) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
