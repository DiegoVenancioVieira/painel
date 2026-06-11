import { AlertDetailClient } from "@/components/AlertDetailClient";

export const dynamic = "force-dynamic";

export default function AlertaDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  return <AlertDetailClient id={params.id} />;
}
