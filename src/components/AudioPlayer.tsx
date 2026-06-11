"use client";

interface Props {
  audioId: string | null;
}

export function AudioPlayer({ audioId }: Props) {
  if (!audioId) {
    return (
      <p className="text-sm text-slate-400">Nenhuma gravação de áudio neste alerta.</p>
    );
  }
  return (
    <audio
      controls
      preload="none"
      className="w-full"
      src={`/api/assets/${audioId}`}
    >
      Seu navegador não suporta áudio.
    </audio>
  );
}
