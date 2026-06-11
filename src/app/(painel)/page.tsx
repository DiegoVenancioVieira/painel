import { DashboardClient } from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Alertas</h1>
        <p className="text-sm text-slate-500">
          Monitoramento em tempo real dos botões de pânico.
        </p>
      </div>
      <DashboardClient />
    </>
  );
}
