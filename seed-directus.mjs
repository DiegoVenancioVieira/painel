#!/usr/bin/env node
/**
 * Popula o Directus com dados de exemplo para testar o Painel SOS:
 * 1 usuária, 2 guardiões, 1 alerta ativo com rastro de localização e 1 resolvido.
 *
 * Idempotente por telefone da usuária de exemplo.
 *
 * Uso: DIRECTUS_URL=... DIRECTUS_TOKEN=... node seed-directus.mjs
 */

import { URL, TOKEN } from './env.mjs';

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

const TEL_DEMO = '+5511999990001';

async function main() {
  // Usuária (idempotente por telefone)
  let usuarias = await api('GET', `/items/usuarias?filter[telefone][_eq]=${encodeURIComponent(TEL_DEMO)}&limit=1`);
  let usuaria = usuarias?.[0];
  if (!usuaria) {
    usuaria = await api('POST', '/items/usuarias', {
      nome: 'Maria de Exemplo', telefone: TEL_DEMO, validada: true,
    });
    console.log('✓ usuária de exemplo criada');
  } else {
    console.log('· usuária de exemplo já existe');
  }

  // Guardiões
  const guardioes = await api('GET', `/items/guardioes?filter[usuaria_id][_eq]=${usuaria.id}&limit=1`);
  if (!guardioes?.length) {
    await api('POST', '/items/guardioes', { usuaria_id: usuaria.id, nome: 'João (irmão)', telefone: '+5511988887777' });
    await api('POST', '/items/guardioes', { usuaria_id: usuaria.id, nome: 'Ana (vizinha)', telefone: '+5511977776666' });
    console.log('✓ 2 guardiões criados');
  } else {
    console.log('· guardiões já existem');
  }

  // Alerta ativo com rastro
  const ativos = await api('GET', `/items/alertas?filter[usuaria_id][_eq]=${usuaria.id}&filter[status][_eq]=ativo&limit=1`);
  if (!ativos?.length) {
    const baseLat = -10.9095, baseLng = -37.0560; // Centro de Aracaju/SE (Praça Fausto Cardoso)
    const alerta = await api('POST', '/items/alertas', {
      usuaria_id: usuaria.id, status: 'ativo',
      latitude_inicial: baseLat, longitude_inicial: baseLng,
      sincronizado_offline: false,
    });
    // rastro de 6 pontos andando
    for (let i = 1; i <= 6; i++) {
      await api('POST', '/items/localizacoes_alerta', {
        alerta_id: alerta.id,
        latitude: baseLat + i * 0.0008,
        longitude: baseLng + i * 0.0006,
      });
    }
    console.log('✓ alerta ativo + rastro (6 pontos) criados');
  } else {
    console.log('· alerta ativo já existe');
  }

  // Alerta resolvido (histórico)
  const resolvidos = await api('GET', `/items/alertas?filter[usuaria_id][_eq]=${usuaria.id}&filter[status][_eq]=resolvido&limit=1`);
  if (!resolvidos?.length) {
    await api('POST', '/items/alertas', {
      usuaria_id: usuaria.id, status: 'resolvido',
      latitude_inicial: -10.9430, longitude_inicial: -37.0640, // Grageru, Aracaju/SE
      sincronizado_offline: true,
    });
    console.log('✓ alerta resolvido (histórico) criado');
  } else {
    console.log('· alerta resolvido já existe');
  }

  console.log('\n✅ Seed concluído.');
}

main().catch((e) => { console.error('💥', e.message); process.exit(1); });
