#!/usr/bin/env node
/**
 * Bootstrap da coleção `despachos` (vínculo alerta ↔ viatura).
 * Concede à role "Operadora": read, create e update.
 *
 * Idempotente. Detecta Directus 10 vs 11+.
 * Uso: node bootstrap-despachos.mjs
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

const collectionExists = async (n) => (await api('GET', `/collections/${n}`)).ok;
const fieldExists = async (c, f) => (await api('GET', `/fields/${c}/${f}`)).ok;
const relationExists = async (c, f) => (await api('GET', `/relations/${c}/${f}`)).ok;

const STATUS_CHOICES = [
  { text: 'Designada', value: 'designada' },
  { text: 'A caminho', value: 'a_caminho' },
  { text: 'No local', value: 'no_local' },
  { text: 'Encerrada', value: 'encerrada' },
];

const def = {
  collection: 'despachos',
  meta: { icon: 'send', note: 'Designação de viaturas para alertas' },
  fields: [
    { field: 'alerta_id', type: 'uuid', meta: { interface: 'select-dropdown-m2o', special: ['m2o'] } },
    { field: 'viatura_id', type: 'uuid', meta: { interface: 'select-dropdown-m2o', special: ['m2o'] } },
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: STATUS_CHOICES }, note: 'designada, a_caminho, no_local, encerrada' }, schema: { default_value: 'designada' } },
    { field: 'observacao', type: 'text', meta: {} },
    { field: 'data_designacao', type: 'timestamp', meta: { special: ['date-created'], readonly: true } },
    { field: 'data_chegada', type: 'timestamp', meta: { interface: 'datetime' } },
  ],
};

const relations = [
  { collection: 'despachos', field: 'alerta_id', related_collection: 'alertas', on_delete: 'CASCADE' },
  { collection: 'despachos', field: 'viatura_id', related_collection: 'viaturas', on_delete: 'SET NULL' },
];

async function criarColecao() {
  if (await collectionExists(def.collection)) {
    console.log(`• coleção ${def.collection} já existe`);
  } else {
    const r = await api('POST', '/collections', {
      collection: def.collection, meta: { ...def.meta }, schema: {},
      fields: [{ field: 'id', type: 'uuid', meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] }, schema: { is_primary_key: true, length: 36 } }],
    });
    if (!r.ok) { console.error(`✗ ${JSON.stringify(r.json)}`); throw new Error('abortado'); }
    console.log(`✓ coleção ${def.collection} criada`);
  }
  for (const f of def.fields) {
    if (await fieldExists(def.collection, f.field)) { console.log(`    · ${f.field} já existe`); continue; }
    const r = await api('POST', `/fields/${def.collection}`, f);
    console.log(r.ok ? `    ✓ ${f.field}` : `    ✗ ${f.field}: ${JSON.stringify(r.json)}`);
  }
}

async function criarRelations() {
  for (const rel of relations) {
    if (await relationExists(rel.collection, rel.field)) { console.log(`• relation ${rel.field} já existe`); continue; }
    const r = await api('POST', '/relations', {
      collection: rel.collection, field: rel.field, related_collection: rel.related_collection,
      meta: { sort_field: null }, schema: { on_delete: rel.on_delete },
    });
    console.log(r.ok ? `✓ relation ${rel.field} → ${rel.related_collection}` : `✗ relation ${rel.field}: ${JSON.stringify(r.json)}`);
  }
}

async function getMajor() {
  const { ok, json } = await api('GET', '/server/info');
  const m = parseInt(String(ok && json?.data?.version || '11').split('.')[0], 10);
  return Number.isFinite(m) ? m : 11;
}
async function acharPorNome(col, nome) {
  const { ok, json } = await api('GET', `/${col}?filter[name][_eq]=${encodeURIComponent(nome)}&limit=1`);
  return ok && json?.data?.length ? json.data[0] : null;
}

async function permissoesOperadora(major) {
  console.log('\n== Permissões (Operadora) ==');
  let target, campo;
  if (major >= 11) {
    const p = await acharPorNome('policies', 'Operadora');
    if (!p) { console.log('· policy "Operadora" não encontrada — rode bootstrap-rbac.mjs'); return; }
    target = { policy: p.id }; campo = 'policy';
  } else {
    const r = await acharPorNome('roles', 'Operadora');
    if (!r) { console.log('· role "Operadora" não encontrada — rode bootstrap-rbac.mjs'); return; }
    target = { role: r.id }; campo = 'role';
  }
  const alvo = target.policy ?? target.role;
  const { json } = await api('GET', `/permissions?filter[${campo}][_eq]=${alvo}&limit=-1`);
  const existentes = new Set((json?.data ?? []).map((p) => `${p.collection}:${p.action}`));
  for (const action of ['read', 'create', 'update']) {
    const chave = `despachos:${action}`;
    if (existentes.has(chave)) { console.log(`    · ${chave} já existe`); continue; }
    const r = await api('POST', '/permissions', { ...target, collection: 'despachos', action, fields: ['*'], permissions: {}, validation: {} });
    console.log(r.ok ? `    ✓ ${chave}` : `    ✗ ${chave}: ${JSON.stringify(r.json)}`);
  }
}

async function main() {
  if (!(await api('GET', '/server/ping')).ok) { console.error('✗ Directus inacessível.'); process.exit(1); }
  console.log('== Coleção despachos ==');
  await criarColecao();
  console.log('\n== Relations ==');
  await criarRelations();
  await permissoesOperadora(await getMajor());
  console.log('\n✅ Bootstrap de despachos concluído.');
}

main().catch((e) => { console.error('\n💥 Erro:', e.message); process.exit(1); });
