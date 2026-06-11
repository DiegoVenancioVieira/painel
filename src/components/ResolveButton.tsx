"use client";

import { useState } from "react";
import { useToast } from "./Toast";

interface Props {
  alertaId: string;
  onResolvido?: () => void;
}

export function ResolveButton({ alertaId, onResolvido }: Props) {
  const { push } = useToast();
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function resolver() {
    setEnviando(true);
    try {
      const res = await fetch(`/api/alertas/${alertaId}/resolver`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        push({
          tipo: "erro",
          titulo: "Erro ao resolver",
          descricao: data.error ?? "Tente novamente.",
        });
        return;
      }
      push({ tipo: "sucesso", titulo: "Alerta resolvido com sucesso." });
      setAberto(false);
      onResolvido?.();
    } catch {
      push({ tipo: "erro", titulo: "Erro de rede." });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        Marcar como resolvido
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-titulo"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 id="modal-titulo" className="text-lg font-semibold">
              Resolver alerta?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              O alerta será marcado como <strong>resolvido</strong> e registrará você
              como responsável. Confirme apenas se a ocorrência já foi tratada.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setAberto(false)}
                disabled={enviando}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={resolver}
                disabled={enviando}
                className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {enviando ? "Resolvendo…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
