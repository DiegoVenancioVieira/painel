import { redirect } from "next/navigation";

// O mapa agora é a tela inicial. Mantemos /mapa como atalho que redireciona.
export default function MapaPage() {
  redirect("/");
}
