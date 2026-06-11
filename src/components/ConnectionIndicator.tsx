"use client";

import { useConnection } from "./ConnectionContext";

const MAP = {
  online: { label: "Ao vivo", dot: "bg-emerald-500" },
  reconnecting: { label: "Reconectando", dot: "bg-amber-500 animate-pulse" },
  offline: { label: "Offline", dot: "bg-slate-400" },
} as const;

export function ConnectionIndicator() {
  const { status } = useConnection();
  const cfg = MAP[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
      title={`Conexão: ${cfg.label}`}
    >
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
