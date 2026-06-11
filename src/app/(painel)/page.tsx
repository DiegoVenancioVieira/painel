import { MapaGeralClient } from "@/components/MapaGeralClient";
import { DashboardClient } from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Tela inicial: mapa dos alertas ativos em largura total */}
      <MapaGeralClient
        alturaClass="h-[60vh]"
        titulo="Mapa de alertas ativos"
        edgeToEdge
      />

      {/* Lista de alertas na parte inferior (container centralizado) */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold tracking-tight">Alertas</h2>
          <p className="text-sm text-slate-500">
            Monitoramento em tempo real dos botões de pânico.
          </p>
        </div>
        <DashboardClient />
      </section>
    </div>
  );
}
