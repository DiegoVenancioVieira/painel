import type { Guardiao } from "@/types/schema";
import { telefoneWhatsapp } from "@/lib/format";

export function GuardiansList({ guardioes }: { guardioes: Guardiao[] }) {
  if (guardioes.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Esta usuária não cadastrou guardiões.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {guardioes.map((g) => {
        const wpp = telefoneWhatsapp(g.telefone);
        return (
          <li
            key={g.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{g.nome}</p>
              <p className="text-xs text-slate-500">{g.telefone}</p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <a
                href={`tel:${g.telefone}`}
                className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                title="Ligar"
              >
                Ligar
              </a>
              {wpp && (
                <a
                  href={`https://wa.me/${wpp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-emerald-100 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                  title="Abrir no WhatsApp"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
