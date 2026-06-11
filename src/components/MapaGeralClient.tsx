"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { Alerta } from "@/types/schema";

const MapaGeral = dynamic(() => import("./MapaGeral"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-400">
      Carregando mapa…
    </div>
  ),
});

export function MapaGeralClient() {
  const router = useRouter();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let vivo = true;
    async function buscar() {
      try {
        const res = await fetch("/api/alertas?status=ativo&limit=200", {
          cache: "no-store",
        });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) return;
        const json = (await res.json()) as { data: Alerta[] };
        if (vivo) setAlertas(json.data);
      } finally {
        if (vivo) setCarregando(false);
      }
    }
    buscar();
    const t = setInterval(buscar, 10000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [router]);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Mapa de alertas ativos</h1>
        <p className="text-sm text-slate-500">
          {carregando
            ? "Carregando…"
            : `${alertas.length} alerta(s) ativo(s) com localização.`}
        </p>
      </div>
      <div className="h-[70vh] overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <MapaGeral alertas={alertas} />
      </div>
    </div>
  );
}
