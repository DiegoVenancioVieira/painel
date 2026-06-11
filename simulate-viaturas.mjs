#!/usr/bin/env node
/**
 * Simulador de movimento das viaturas (substitui o app/PWA do motorista no teste).
 * A cada `INTERVALO`s, move cada viatura ativa um passo, atualiza a última posição
 * e registra um ponto em viatura_posicoes — exatamente o que o endpoint de ingestão
 * fará em produção.
 *
 * Uso:
 *   node simulate-viaturas.mjs            # roda ~contínuo (até Ctrl+C)
 *   TICKS=10 INTERVALO=3 node simulate-viaturas.mjs
 */

import { URL, TOKEN } from './env.mjs';

const INTERVALO = Number(process.env.INTERVALO || 4) * 1000;
const TICKS = Number(process.env.TICKS || 0); // 0 = infinito

async function api(method, path, body) {
  const res = await fetch(`${URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json)}`);
  return json?.data;
}

function headingGraus(dLat, dLng) {
  // aproximação: ângulo em graus 0=Norte, sentido horário
  const ang = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  return (ang + 360) % 360;
}

async function tick() {
  const viaturas = await api('GET', '/items/viaturas?filter[ativa][_eq]=true&fields=id,identificador,ultima_lat,ultima_lng&limit=-1');
  for (const v of viaturas) {
    const baseLat = v.ultima_lat ?? -23.561;
    const baseLng = v.ultima_lng ?? -46.656;
    // passo aleatório (~30-60m)
    const dLat = (Math.random() - 0.5) * 0.0008;
    const dLng = (Math.random() - 0.5) * 0.0008;
    const lat = baseLat + dLat;
    const lng = baseLng + dLng;
    const direcao = headingGraus(dLat, dLng);
    const velocidade = Math.round(20 + Math.random() * 40);
    const agora = new Date().toISOString();

    await api('PATCH', `/items/viaturas/${v.id}`, {
      ultima_lat: lat, ultima_lng: lng, ultima_velocidade: velocidade,
      ultima_direcao: direcao, ultimo_ping: agora,
    });
    await api('POST', '/items/viatura_posicoes', {
      viatura_id: v.id, latitude: lat, longitude: lng,
      velocidade, direcao,
    });
  }
  return viaturas.length;
}

async function main() {
  console.log(`Simulando movimento (intervalo ${INTERVALO / 1000}s${TICKS ? `, ${TICKS} ticks` : ', contínuo'})…`);
  let n = 0;
  while (TICKS === 0 || n < TICKS) {
    const qtd = await tick();
    n++;
    console.log(`  tick ${n}: ${qtd} viatura(s) movida(s)`);
    if (TICKS && n >= TICKS) break;
    await new Promise((r) => setTimeout(r, INTERVALO));
  }
  console.log('✅ Simulação concluída.');
}

main().catch((e) => { console.error('💥', e.message); process.exit(1); });
