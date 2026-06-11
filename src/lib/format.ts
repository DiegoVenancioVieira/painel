// Helpers de formatação em pt-BR.

export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function tempoRelativo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  const agora = Date.now();
  const seg = Math.round((agora - d) / 1000);
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  if (Math.abs(seg) < 60) return rtf.format(-seg, "second");
  const min = Math.round(seg / 60);
  if (Math.abs(min) < 60) return rtf.format(-min, "minute");
  const horas = Math.round(min / 60);
  if (Math.abs(horas) < 24) return rtf.format(-horas, "hour");
  const dias = Math.round(horas / 24);
  return rtf.format(-dias, "day");
}

export function nomeUsuaria(
  usuaria: { nome?: string } | string | null | undefined,
): string {
  if (!usuaria) return "Usuária desconhecida";
  if (typeof usuaria === "string") return "Usuária";
  return usuaria.nome ?? "Usuária";
}

export function telefoneUsuaria(
  usuaria: { telefone?: string } | string | null | undefined,
): string | null {
  if (!usuaria || typeof usuaria === "string") return null;
  return usuaria.telefone ?? null;
}

// Normaliza telefone para link de WhatsApp (só dígitos, com DDI 55 se ausente).
export function telefoneWhatsapp(telefone: string | null): string | null {
  if (!telefone) return null;
  let d = telefone.replace(/\D/g, "");
  if (d.length <= 11) d = "55" + d;
  return d;
}
