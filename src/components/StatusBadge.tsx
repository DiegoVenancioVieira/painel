import type { StatusAlerta } from "@/types/schema";

const MAP: Record<StatusAlerta, { label: string; classes: string }> = {
  ativo: { label: "Ativo", classes: "bg-red-100 text-red-700 ring-red-600/30" },
  resolvido: {
    label: "Resolvido",
    classes: "bg-emerald-100 text-emerald-700 ring-emerald-600/30",
  },
  teste: { label: "Teste", classes: "bg-slate-100 text-slate-600 ring-slate-500/30" },
};

export function StatusBadge({ status }: { status: StatusAlerta }) {
  const cfg = MAP[status] ?? MAP.teste;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}
