"use client";

import { useEffect, useState } from "react";
import {
  setSomAtivo,
  setSomVolume,
  somAtivo,
  somVolume,
  tocarAlerta,
} from "@/lib/som";

export function SoundControls() {
  const [ativo, setAtivo] = useState(true);
  const [vol, setVol] = useState(0.5);

  useEffect(() => {
    setAtivo(somAtivo());
    setVol(somVolume());
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <button
        onClick={() => {
          const novo = !ativo;
          setAtivo(novo);
          setSomAtivo(novo);
          if (novo) tocarAlerta();
        }}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 hover:bg-slate-100"
        title={ativo ? "Som ligado" : "Som desligado"}
        aria-pressed={ativo}
      >
        {ativo ? "🔔" : "🔕"} Som
      </button>
      {ativo && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={vol}
          onChange={(e) => {
            const v = Number(e.target.value);
            setVol(v);
            setSomVolume(v);
          }}
          onMouseUp={() => tocarAlerta()}
          aria-label="Volume do alerta"
          className="h-1 w-24 cursor-pointer accent-sos-600"
        />
      )}
    </div>
  );
}
