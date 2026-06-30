"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { Alerta, Viatura } from "@/types/schema";

const MapaGeral = dynamic(() => import("./MapaGeral"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-400">
      Carregando mapa…
    </div>
  ),
});

interface Props {
  /** Altura do container do mapa (classe Tailwind). */
  alturaClass?: string;
  /** Título exibido acima do mapa. */
  titulo?: string;
  /** Mapa coladinho nas bordas (largura total, sem borda/arredondamento). */
  edgeToEdge?: boolean;
}

export function MapaGeralClient({
  alturaClass = "h-[70vh]",
  titulo = "Mapa de alertas ativos",
  edgeToEdge = false,
}: Props = {}) {
  const router = useRouter();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarAlertas, setMostrarAlertas] = useState(true);
  const [mostrarViaturas, setMostrarViaturas] = useState(true);

  useEffect(() => {
    let vivo = true;
    async function buscar() {
      try {
        const [ra, rv] = await Promise.all([
          fetch("/api/alertas?status=ativo&limit=200", { cache: "no-store" }),
          fetch("/api/viaturas", { cache: "no-store" }),
        ]);
        if (ra.status === 401 || rv.status === 401) {
          router.replace("/login");
          return;
        }
        if (ra.ok) {
          const j = (await ra.json()) as { data: Alerta[] };
          if (vivo) setAlertas(j.data);
        }
        if (rv.ok) {
          const j = (await rv.json()) as { data: Viatura[] };
          if (vivo) setViaturas(j.data);
        }
      } finally {
        if (vivo) setCarregando(false);
      }
    }
    buscar();
    const t = setInterval(buscar, 5000); // viaturas movem-se: atualização mais frequente
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [router]);

  const viaturasOnline = viaturas.filter(
    (v) => v.ultimo_ping && Date.now() - new Date(v.ultimo_ping).getTime() < 60_000,
  ).length;

  return (
    <div>
      <div className={`mb-4 ${edgeToEdge ? "px-4 pt-6" : ""}`}>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        <p className="text-sm text-slate-500">
          {carregando
            ? "Carregando…"
            : `${alertas.length} alerta(s) ativo(s) · ${viaturas.length} viatura(s) (${viaturasOnline} online).`}
        </p>

        {/* Legenda + toggles */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
          <button
            onClick={() => setMostrarAlertas((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1 ring-inset transition ${
              mostrarAlertas
                ? "bg-sos-50 text-sos-700 ring-sos-200"
                : "bg-slate-100 text-slate-400 ring-slate-200 line-through"
            }`}
            aria-pressed={mostrarAlertas}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-sos-600" /> Alertas
          </button>
          <button
            onClick={() => setMostrarViaturas((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1 ring-inset transition ${
              mostrarViaturas
                ? "bg-aju-50 text-aju-700 ring-aju-200"
                : "bg-slate-100 text-slate-400 ring-slate-200 line-through"
            }`}
            aria-pressed={mostrarViaturas}
          >
            🚓 Viaturas
          </button>
          <span className="text-slate-400">
            anel azul = PM · verde = GCM · roxo = parceira · esmaecido = offline
          </span>
        </div>
      </div>

      <div
        className={
          edgeToEdge
            ? `${alturaClass} w-full overflow-hidden`
            : `${alturaClass} overflow-hidden rounded-xl border border-slate-200 shadow-sm`
        }
      >
        <MapaGeral
          alertas={mostrarAlertas ? alertas : []}
          viaturas={mostrarViaturas ? viaturas : []}
        />
      </div>
    </div>
  );
}
