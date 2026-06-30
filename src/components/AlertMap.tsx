"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import type { LocalizacaoAlerta } from "@/types/schema";
import { formatarDataHora } from "@/lib/format";

// Ícones via divIcon para não depender dos PNGs default do Leaflet.
function pino(cor: string, pulso = false) {
  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;width:18px;height:18px;border-radius:9999px;
      background:${cor};border:3px solid white;box-shadow:0 0 0 1px rgba(0,0,0,.25);
      ${pulso ? "animation:pulseRing 1.6s infinite;" : ""}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const ICON_INICIAL = pino("#64748b");
const ICON_ATUAL = pino("#dc2626", true);

interface Props {
  inicial: { lat: number; lng: number } | null;
  rastro: LocalizacaoAlerta[];
}

function AjustarBounds({ pontos }: { pontos: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (pontos.length === 0) return;
    if (pontos.length === 1) {
      map.setView(pontos[0], 16);
    } else {
      map.fitBounds(L.latLngBounds(pontos), { padding: [40, 40] });
    }
  }, [map, pontos]);
  return null;
}

export default function AlertMap({ inicial, rastro }: Props) {
  const linha: [number, number][] = rastro.map((r) => [r.latitude, r.longitude]);
  const todos: [number, number][] = [...linha];
  if (inicial) todos.unshift([inicial.lat, inicial.lng]);

  const ultima = rastro.length > 0 ? rastro[rastro.length - 1] : null;
  const centro: [number, number] = todos[0] ?? [-10.9472, -37.0731]; // fallback: centro de Aracaju/SE

  return (
    <MapContainer center={centro} zoom={15} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {linha.length > 1 && (
        <Polyline positions={linha} pathOptions={{ color: "#dc2626", weight: 4, opacity: 0.7 }} />
      )}

      {inicial && (
        <Marker position={[inicial.lat, inicial.lng]} icon={ICON_INICIAL}>
          <Popup>Localização inicial do alerta</Popup>
        </Marker>
      )}

      {ultima && (
        <Marker position={[ultima.latitude, ultima.longitude]} icon={ICON_ATUAL}>
          <Popup>
            Última posição conhecida
            <br />
            {formatarDataHora(ultima.data_hora)}
          </Popup>
        </Marker>
      )}

      <AjustarBounds pontos={todos} />
    </MapContainer>
  );
}
