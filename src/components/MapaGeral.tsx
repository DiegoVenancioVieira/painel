"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import Link from "next/link";
import type { Alerta, Viatura } from "@/types/schema";
import { nomeUsuaria, tempoRelativo } from "@/lib/format";

const ICON_ALERTA = L.divIcon({
  className: "",
  html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;
    background:#dc2626;border:3px solid white;box-shadow:0 0 0 1px rgba(0,0,0,.25);
    animation:pulseRing 1.6s infinite;"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const COR_TIPO: Record<string, string> = {
  PM: "#2563eb",
  GCM: "#0d9488",
  parceira: "#7c3aed",
};

function online(ultimoPing: string | null): boolean {
  if (!ultimoPing) return false;
  return Date.now() - new Date(ultimoPing).getTime() < 60_000;
}

const EMOJI_TIPO: Record<string, string> = {
  PM: "🚓",
  GCM: "🚓",
  parceira: "🚙",
};

// Ícone de viatura: emoji de viatura sobre um disco com cor/anel por tipo.
function iconeViatura(v: Viatura): L.DivIcon {
  const on = online(v.ultimo_ping);
  const cor = on ? COR_TIPO[v.tipo] ?? "#2563eb" : "#94a3b8";
  const emoji = EMOJI_TIPO[v.tipo] ?? "🚓";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:32px;height:32px;border-radius:9999px;display:flex;align-items:center;justify-content:center;
      background:white;border:2px solid ${cor};box-shadow:0 1px 3px rgba(0,0,0,.35);
      font-size:18px;line-height:1;opacity:${on ? 1 : 0.55};">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

interface Props {
  alertas: Alerta[];
  viaturas?: Viatura[];
}

function Ajustar({ pontos }: { pontos: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (pontos.length === 0) return;
    if (pontos.length === 1) map.setView(pontos[0], 14);
    else map.fitBounds(L.latLngBounds(pontos), { padding: [50, 50] });
  }, [map, pontos]);
  return null;
}

export default function MapaGeral({ alertas, viaturas = [] }: Props) {
  const alertasGeo = alertas.filter(
    (a) => a.latitude_inicial != null && a.longitude_inicial != null,
  );
  const viaturasGeo = viaturas.filter(
    (v) => v.ultima_lat != null && v.ultima_lng != null,
  );

  // Bounds estáveis: baseados nos alertas; se não houver, na 1ª viatura.
  const pontosBounds: [number, number][] = alertasGeo.map((a) => [
    a.latitude_inicial as number,
    a.longitude_inicial as number,
  ]);
  const centro: [number, number] =
    pontosBounds[0] ??
    (viaturasGeo[0]
      ? [viaturasGeo[0].ultima_lat as number, viaturasGeo[0].ultima_lng as number]
      : [-10.9472, -37.0731]); // fallback: centro de Aracaju/SE

  return (
    <MapContainer center={centro} zoom={13} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Alertas */}
      {alertasGeo.map((a) => (
        <Marker
          key={`a-${a.id}`}
          position={[a.latitude_inicial as number, a.longitude_inicial as number]}
          icon={ICON_ALERTA}
        >
          <Popup>
            <p className="font-semibold">{nomeUsuaria(a.usuaria_id)}</p>
            <p className="text-xs text-slate-500">{tempoRelativo(a.data_criacao)}</p>
            <Link href={`/alertas/${a.id}`} className="text-sos-600 underline">
              Abrir alerta →
            </Link>
          </Popup>
        </Marker>
      ))}

      {/* Viaturas */}
      {viaturasGeo.map((v) => (
        <Marker
          key={`v-${v.id}`}
          position={[v.ultima_lat as number, v.ultima_lng as number]}
          icon={iconeViatura(v)}
        >
          <Popup>
            <p className="font-semibold">
              {v.identificador} <span className="text-xs text-slate-500">({v.tipo})</span>
            </p>
            <p className="text-xs text-slate-500">
              {online(v.ultimo_ping) ? "🟢 Online" : "⚪ Offline"} ·{" "}
              {v.ultima_velocidade != null ? `${Math.round(v.ultima_velocidade)} km/h` : "—"}
            </p>
            <p className="text-xs text-slate-400">
              Último ping: {tempoRelativo(v.ultimo_ping)}
            </p>
          </Popup>
        </Marker>
      ))}

      <Ajustar pontos={pontosBounds} />
    </MapContainer>
  );
}
