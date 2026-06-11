"use client";

import { useState } from "react";
import type { Alerta } from "@/types/schema";
import { useAlertasRealtime } from "@/hooks/useAlertasRealtime";
import { AlertCard } from "./AlertCard";
import { SoundControls } from "./SoundControls";
import { useToast } from "./Toast";
import { tocarAlerta } from "@/lib/som";
import { nomeUsuaria } from "@/lib/format";

const FILTROS = [
  { key: "ativo", label: "Ativos" },
  { key: "resolvido", label: "Resolvidos" },
  { key: "teste", label: "Testes" },
  { key: "todos", label: "Todos" },
] as const;

export function DashboardClient() {
  const [filtro, setFiltro] = useState<string>("ativo");
  const { push } = useToast();

  const { alertas, total, carregando, erro } = useAlertasRealtime({
    status: filtro,
    onNovoAtivo: (a: Alerta) => {
      tocarAlerta();
      push({
        tipo: "alerta",
        titulo: "🚨 Novo alerta ativo!",
        descricao: nomeUsuaria(a.usuaria_id),
      });
    },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                filtro === f.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              aria-pressed={filtro === f.key}
            >
              {f.label}
            </button>
          ))}
        </div>
        <SoundControls />
      </div>

      {erro && (
        <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 ring-1 ring-inset ring-amber-200">
          {erro}
        </p>
      )}

      {carregando ? (
        <SkeletonGrid />
      ) : alertas.length === 0 ? (
        <EmptyState filtro={filtro} />
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">
            {total} alerta{total === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alertas.map((a) => (
              <AlertCard key={a.id} alerta={a} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ filtro }: { filtro: string }) {
  const msg =
    filtro === "ativo"
      ? "Nenhum alerta ativo no momento. Tudo tranquilo. 🌿"
      : "Nenhum alerta para este filtro.";
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
      <p className="text-slate-500">{msg}</p>
    </div>
  );
}
