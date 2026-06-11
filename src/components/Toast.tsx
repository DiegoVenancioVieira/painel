"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
} from "react";

type ToastTipo = "alerta" | "info" | "erro" | "sucesso";

interface ToastItem {
  id: number;
  tipo: ToastTipo;
  titulo: string;
  descricao?: string;
}

interface ToastCtx {
  push: (t: Omit<ToastItem, "id">) => void;
}

const Ctx = createContext<ToastCtx>({ push: () => {} });

const ESTILOS: Record<ToastTipo, string> = {
  alerta: "border-sos-600 bg-sos-50 text-sos-700",
  info: "border-sky-500 bg-sky-50 text-sky-700",
  erro: "border-red-500 bg-red-50 text-red-700",
  sucesso: "border-emerald-500 bg-emerald-50 text-emerald-700",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const push = useCallback((t: Omit<ToastItem, "id">) => {
    const id = ++seq.current;
    setItens((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setItens((prev) => prev.filter((i) => i.id !== id));
    }, 8000);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {itens.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto rounded-lg border-l-4 bg-white p-3 shadow-lg ring-1 ring-slate-200 ${ESTILOS[t.tipo]}`}
          >
            <p className="text-sm font-semibold">{t.titulo}</p>
            {t.descricao && <p className="mt-0.5 text-xs">{t.descricao}</p>}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
