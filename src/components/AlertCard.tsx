import Link from "next/link";
import type { Alerta } from "@/types/schema";
import { StatusBadge } from "./StatusBadge";
import {
  formatarDataHora,
  nomeUsuaria,
  telefoneUsuaria,
  tempoRelativo,
} from "@/lib/format";

export function AlertCard({ alerta }: { alerta: Alerta }) {
  const ativo = alerta.status === "ativo";
  const nome = nomeUsuaria(alerta.usuaria_id);
  const tel = telefoneUsuaria(alerta.usuaria_id);

  return (
    <Link
      href={`/alertas/${alerta.id}`}
      className={`block rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
        ativo
          ? "border-sos-300 ring-2 ring-sos-500/40 animate-pulseRing"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{nome}</p>
          {tel && <p className="text-sm text-slate-500">{tel}</p>}
        </div>
        <StatusBadge status={alerta.status} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span title={formatarDataHora(alerta.data_criacao)}>
          {tempoRelativo(alerta.data_criacao)}
        </span>
        <span className="flex items-center gap-2">
          {alerta.sincronizado_offline && (
            <span
              className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-700"
              title="Alerta sincronizado após falha de rede"
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.24 4.24 0 0 0-6 0z" />
              </svg>
              offline
            </span>
          )}
          <span className="font-medium text-sos-600 group-hover:underline">
            Abrir →
          </span>
        </span>
      </div>
    </Link>
  );
}
