"use client";

import { useEffect, useState } from "react";
import type { Alerta } from "@/types/schema";
import { useAlertasRealtime } from "@/hooks/useAlertasRealtime";
import { AlertCard } from "./AlertCard";
import { SoundControls } from "./SoundControls";
import { useToast } from "./Toast";
import { iniciarAlarme, pararAlarme } from "@/lib/som";
import { nomeUsuaria } from "@/lib/format";

const FILTROS = [
  { key: "ativo", label: "Ativos" },
  { key: "resolvido", label: "Resolvidos" },
  { key: "teste", label: "Testes" },
  { key: "todos", label: "Todos" },
] as const;

export function DashboardClient() {
  const [filtro, setFiltro] = useState<string>("ativo");
  const [alarme, setAlarme] = useState<{ nome: string; total: number } | null>(
    null,
  );
  const { push } = useToast();

  const { alertas, total, carregando, erro } = useAlertasRealtime({
    status: filtro,
    onNovoAtivo: (a: Alerta) => {
      const nome = nomeUsuaria(a.usuaria_id);
      iniciarAlarme();
      setAlarme((prev) => ({ nome, total: (prev?.total ?? 0) + 1 }));
      push({
        tipo: "alerta",
        titulo: "🚨 Novo alerta ativo!",
        descricao: nome,
      });
    },
  });

  // Garante que o alarme pare ao sair da tela.
  useEffect(() => () => pararAlarme(), []);

  function reconhecer() {
    pararAlarme();
    setAlarme(null);
  }

  return (
    <div>
      {alarme && <AlarmeOverlay alarme={alarme} onReconhecer={reconhecer} />}
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

/** Sobreposição de alarme: tela inteira piscando em vermelho + reconhecimento. */
function AlarmeOverlay({
  alarme,
  onReconhecer,
}: {
  alarme: { nome: string; total: number };
  onReconhecer: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24">
      {/* Camada que pisca em vermelho sobre toda a tela */}
      <div className="pointer-events-none absolute inset-0 animate-screenFlash" />
      <div className="absolute inset-0 ring-[6px] ring-inset ring-sos-600/70" />
      {/* Cartão de reconhecimento (clicável) */}
      <div className="pointer-events-auto relative w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl ring-4 ring-sos-600">
        <div className="mx-auto mb-3 flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-sos-100 text-3xl">
          🚨
        </div>
        <h2 className="text-xl font-bold text-sos-700">
          {alarme.total > 1
            ? `${alarme.total} novos alertas ativos!`
            : "Novo alerta ativo!"}
        </h2>
        <p className="mt-1 text-slate-600">{alarme.nome}</p>
        <button
          onClick={onReconhecer}
          className="mt-5 w-full rounded-lg bg-sos-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-sos-700"
        >
          Reconhecer e silenciar
        </button>
      </div>
    </div>
  );
}
