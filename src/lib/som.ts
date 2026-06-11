// Som de alerta gerado via WebAudio (não depende de arquivo de áudio).
// Preferências (ligado/volume) persistidas em localStorage por operadora.

const KEY_ATIVO = "sos_som_ativo";
const KEY_VOL = "sos_som_volume";

export function somAtivo(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(KEY_ATIVO) !== "false";
}

export function setSomAtivo(v: boolean) {
  if (typeof window !== "undefined") localStorage.setItem(KEY_ATIVO, String(v));
}

export function somVolume(): number {
  if (typeof window === "undefined") return 0.5;
  const v = Number(localStorage.getItem(KEY_VOL));
  return Number.isFinite(v) && v > 0 ? v : 0.5;
}

export function setSomVolume(v: number) {
  if (typeof window !== "undefined") localStorage.setItem(KEY_VOL, String(v));
}

let ctx: AudioContext | null = null;

export function tocarAlerta() {
  if (typeof window === "undefined" || !somAtivo()) return;
  try {
    ctx =
      ctx ??
      new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    const vol = somVolume();
    // Dois bips curtos ascendentes.
    const agora = ctx.currentTime;
    [880, 1175].forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t0 = agora + i * 0.22;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.02);
      gain.gain.linearRampToValueAtTime(0, t0 + 0.18);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t0);
      osc.stop(t0 + 0.2);
    });
  } catch {
    // navegador pode bloquear áudio sem interação — ignora
  }
}
