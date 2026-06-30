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

// Áudio do alarme (arquivo em /public/alarme.mp3).
let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio("/alarme.mp3");
    audio.preload = "auto";
  }
  return audio;
}

/** Toca o alarme uma vez (prévia ao ligar o som ou ajustar o volume). */
export function tocarAlerta() {
  if (!somAtivo()) return;
  const a = getAudio();
  if (!a) return;
  try {
    a.loop = false;
    a.volume = somVolume();
    a.currentTime = 0;
    void a.play().catch(() => {});
  } catch {
    // navegador pode bloquear áudio sem interação — ignora
  }
}

/** Inicia o alarme em loop (novo alerta ativo) até ser reconhecido. */
export function iniciarAlarme() {
  if (!somAtivo()) return;
  const a = getAudio();
  if (!a) return;
  try {
    a.loop = true;
    a.volume = somVolume();
    a.currentTime = 0;
    void a.play().catch(() => {});
  } catch {
    // ignora bloqueio de autoplay
  }
}

/** Para o alarme em loop. */
export function pararAlarme() {
  if (!audio) return;
  audio.loop = false;
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch {
    /* noop */
  }
}
