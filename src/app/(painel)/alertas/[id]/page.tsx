import { AlertDetailClient } from "@/components/AlertDetailClient";

export const dynamic = "force-dynamic";

export default function AlertaDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <AlertDetailClient id={params.id} />
    </div>
  );
}
