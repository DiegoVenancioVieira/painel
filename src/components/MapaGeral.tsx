"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import Link from "next/link";
import type { Alerta } from "@/types/schema";
import { nomeUsuaria, tempoRelativo } from "@/lib/format";

const ICON = L.divIcon({
  className: "",
  html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;
    background:#dc2626;border:3px solid white;box-shadow:0 0 0 1px rgba(0,0,0,.25);
    animation:pulseRing 1.6s infinite;"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function Ajustar({ pontos }: { pontos: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (pontos.length === 0) return;
    if (pontos.length === 1) map.setView(pontos[0], 14);
    else map.fitBounds(L.latLngBounds(pontos), { padding: [50, 50] });
  }, [map, pontos]);
  return null;
}

export default function MapaGeral({ alertas }: { alertas: Alerta[] }) {
  const comGeo = alertas.filter(
    (a) => a.latitude_inicial != null && a.longitude_inicial != null,
  );
  const pontos: [number, number][] = comGeo.map((a) => [
    a.latitude_inicial as number,
    a.longitude_inicial as number,
  ]);
  const centro: [number, number] = pontos[0] ?? [-15.78, -47.93];

  return (
    <MapContainer center={centro} zoom={12} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {comGeo.map((a) => (
        <Marker
          key={a.id}
          position={[a.latitude_inicial as number, a.longitude_inicial as number]}
          icon={ICON}
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
      <Ajustar pontos={pontos} />
    </MapContainer>
  );
}
