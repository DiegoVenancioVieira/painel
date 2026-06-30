"use client";

import { useCallback, useEffect, useState } from "react";
import type { Despacho, StatusDespacho, Viatura } from "@/types/schema";
import { useToast } from "./Toast";
import { formatarDistancia } from "@/lib/geo";
import { formatarDataHora } from "@/lib/format";

type ViaturaProxima = Viatura & { distancia: number | null };

const STATUS_LABEL: Record<StatusDespacho, string> = {
  designada: "Designada",
  a_caminho: "A caminho",
  no_local: "No local",
  encerrada: "Encerrada",
};

const STATUS_COR: Record<StatusDespacho, string> = {
  designada: "bg-amber-100 text-amber-700 ring-amber-600/30",
  a_caminho: "bg-sky-100 text-sky-700 ring-sky-600/30",
  no_local: "bg-emerald-100 text-emerald-700 ring-emerald-600/30",
  encerrada: "bg-slate-100 text-slate-500 ring-slate-500/30",
};

function viaturaInfo(d: Despacho): { id: string | null; label: string; tel: string | null } {
  const v = d.viatura_id;
  if (v && typeof v === "object") {
    return { id: v.id, label: `${v.identificador} (${v.tipo})`, tel: v.telefone_contato ?? null };
  }
  return { id: typeof v === "string" ? v : null, label: "Viatura", tel: null };
}

interface Props {
  alertaId: string;
  despachos: Despacho[];
  onChange: () => void;
}

export function DispatchPanel({ alertaId, despachos, onChange }: Props) {
  const { push } = useToast();
  const [proximas, setProximas] = useState<ViaturaProxima[]>([]);
  const [enviando, setEnviando] = useState<string | null>(null);

  const buscarProximas = useCallback(async () => {
    try {
      const res = await fetch(`/api/alertas/${alertaId}/viaturas-proximas`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = (await res.json()) as { data: ViaturaProxima[] };
      setProximas(json.data);
    } catch {
      /* silencioso */
    }
  }, [alertaId]);

  useEffect(() => {
    buscarProximas();
    const t = setInterval(buscarProximas, 10000);
    return () => clearInterval(t);
  }, [buscarProximas]);

  const jaDespachadas = new Set(
    despachos
      .filter((d) => d.status !== "encerrada")
      .map((d) => viaturaInfo(d).id)
      .filter(Boolean) as string[],
  );

  async function designar(viaturaId: string) {
    setEnviando(viaturaId);
    try {
      const res = await fetch(`/api/alertas/${alertaId}/despachar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viatura_id: viaturaId }),
      });
      if (!res.ok) {
        push({ tipo: "erro", titulo: "Falha ao designar viatura." });
        return;
      }
      push({ tipo: "sucesso", titulo: "Viatura designada." });
      onChange();
    } finally {
      setEnviando(null);
    }
  }

  async function mudarStatus(despachoId: string, status: StatusDespacho) {
    const res = await fetch(`/api/despachos/${despachoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      push({ tipo: "erro", titulo: "Falha ao atualizar status." });
      return;
    }
    onChange();
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Despacho de viaturas</h2>

      {/* Despachos atuais */}
      {despachos.length > 0 && (
        <ul className="mb-4 space-y-2">
          {despachos.map((d) => {
            const info = viaturaInfo(d);
            return (
              <li
                key={d.id}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-800">{info.label}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_COR[d.status]}`}
                  >
                    {STATUS_LABEL[d.status]}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <select
                    value={d.status}
                    onChange={(e) => mudarStatus(d.id, e.target.value as StatusDespacho)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                    aria-label="Atualizar status do despacho"
                  >
                    {(Object.keys(STATUS_LABEL) as StatusDespacho[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  {info.tel && (
                    <a
                      href={`tel:${info.tel}`}
                      className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    >
                      Ligar
                    </a>
                  )}
                </div>
                {d.data_chegada && (
                  <p className="mt-1 text-xs text-slate-400">
                    Chegada: {formatarDataHora(d.data_chegada)}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Viaturas próximas para designar */}
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        Viaturas próximas
      </p>
      {proximas.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma viatura disponível.</p>
      ) : (
        <ul className="space-y-1.5">
          {proximas.slice(0, 5).map((v) => {
            const designada = jaDespachadas.has(v.id);
            return (
              <li
                key={v.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  🚓 <span className="font-medium">{v.identificador}</span>{" "}
                  <span className="text-slate-400">
                    {v.distancia != null ? `· ${formatarDistancia(v.distancia)}` : ""}
                  </span>
                </span>
                <button
                  onClick={() => designar(v.id)}
                  disabled={designada || enviando === v.id}
                  className="shrink-0 rounded-md bg-aju-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-aju-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {designada ? "Designada" : enviando === v.id ? "…" : "Designar"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
