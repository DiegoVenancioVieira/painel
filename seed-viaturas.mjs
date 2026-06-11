#!/usr/bin/env node
/**
 * Seed de viaturas para teste do Painel SOS.
 * Cria 3 viaturas com posição inicial pela região central de São Paulo.
 * Idempotente por `identificador`.
 *
 * Uso: node seed-viaturas.mjs
 */

import { URL, TOKEN } from './env.mjs';
import { randomBytes } from 'node:crypto';

const novoToken = () => 'vtk_' + randomBytes(18).toString('base64url');

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

const VIATURAS = [
  { identificador: 'VTR-12', tipo: 'PM', placa: 'ABC1D23', lat: -23.5614, lng: -46.6560 },
  { identificador: 'GCM-07', tipo: 'GCM', placa: 'EFG4H56', lat: -23.5540, lng: -46.6390 },
  { identificador: 'VTR-31', tipo: 'PM', placa: 'IJK7L89', lat: -23.5680, lng: -46.6480 },
];

async function main() {
  const tokens = [];
  for (const v of VIATURAS) {
    const existentes = await api('GET', `/items/viaturas?filter[identificador][_eq]=${encodeURIComponent(v.identificador)}&fields=id,identificador,token&limit=1`);
    if (existentes?.length) {
      const atual = existentes[0];
      // backfill de token se ausente
      let tk = atual.token;
      if (!tk) {
        tk = novoToken();
        await api('PATCH', `/items/viaturas/${atual.id}`, { token: tk });
        console.log(`· ${v.identificador} já existia — token gerado`);
      } else {
        console.log(`· ${v.identificador} já existe`);
      }
      tokens.push([v.identificador, tk]);
      continue;
    }
    const tk = novoToken();
    await api('POST', '/items/viaturas', {
      identificador: v.identificador, tipo: v.tipo, placa: v.placa, ativa: true,
      telefone_contato: '190', token: tk,
      ultima_lat: v.lat, ultima_lng: v.lng,
      ultima_velocidade: 0, ultima_direcao: Math.floor(Math.random() * 360),
      ultimo_ping: new Date().toISOString(),
    });
    tokens.push([v.identificador, tk]);
    console.log(`✓ ${v.identificador} criada`);
  }

  console.log('\nTokens de ingestão (entregar ao app/PWA de cada viatura):');
  for (const [id, tk] of tokens) console.log(`  ${id}: ${tk}`);
  console.log('\n✅ Seed de viaturas concluído. Use `node simulate-viaturas.mjs` para movimentá-las.');
}

main().catch((e) => { console.error('💥', e.message); process.exit(1); });
