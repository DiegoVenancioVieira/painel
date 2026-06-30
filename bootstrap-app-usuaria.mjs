#!/usr/bin/env node
/**
 * Adiciona o campo secreto `token` à coleção `usuarias`, usado pelo app da
 * usuária (Botão do Pânico) para autenticar nas chamadas /api/app/*.
 *
 * Idempotente. Uso: node bootstrap-app-usuaria.mjs
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
  return { ok: res.ok, status: res.status, json };
}

async function fieldExists(c, f) {
  return (await api('GET', `/fields/${c}/${f}`)).ok;
}

async function main() {
  if (!(await api('GET', '/server/ping')).ok) { console.error('✗ Directus inacessível.'); process.exit(1); }

  if (await fieldExists('usuarias', 'token')) {
    console.log('· usuarias.token já existe');
  } else {
    const r = await api('POST', '/fields/usuarias', {
      field: 'token', type: 'string',
      meta: { hidden: true, note: 'Token do app da usuária (secreto)' },
    });
    console.log(r.ok ? '✓ campo usuarias.token criado' : `✗ token: ${JSON.stringify(r.json)}`);
  }

  console.log('\n✅ Bootstrap do app da usuária concluído.');
}

main().catch((e) => { console.error('💥', e.message); process.exit(1); });
