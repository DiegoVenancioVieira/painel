#!/usr/bin/env node
/**
 * Bootstrap da camada de viaturas do Painel SOS.
 *
 * Coleções:
 *  - viaturas: cadastro + última posição desnormalizada (leitura rápida no mapa)
 *  - viatura_posicoes: histórico/rastro GPS (time-series)
 *
 * Também concede permissão de leitura dessas coleções ao papel "Operadora".
 *
 * Idempotente. Detecta Directus 10 (perm por role) vs 11+ (policies).
 *
 * Uso: node bootstrap-viaturas.mjs   (carrega .env.local)
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

async function collectionExists(name) {
  const { ok } = await api('GET', `/collections/${name}`);
  return ok;
}
async function fieldExists(c, f) {
  const { ok } = await api('GET', `/fields/${c}/${f}`);
  return ok;
}
async function relationExists(c, f) {
  const { ok } = await api('GET', `/relations/${c}/${f}`);
  return ok;
}

const collections = [
  {
    collection: 'viaturas',
    meta: { icon: 'local_police', note: 'Cadastro de viaturas e última posição conhecida' },
    fields: [
      { field: 'identificador', type: 'string', meta: { required: true, note: 'Ex.: VTR-12' }, schema: { is_nullable: false } },
      { field: 'tipo', type: 'string', meta: { note: 'PM, GCM, parceira', interface: 'select-dropdown', options: { choices: [
        { text: 'PM', value: 'PM' }, { text: 'GCM', value: 'GCM' }, { text: 'Parceira', value: 'parceira' },
      ] } }, schema: { default_value: 'PM' } },
      { field: 'placa', type: 'string', meta: {} },
      { field: 'telefone_contato', type: 'string', meta: {} },
      { field: 'ativa', type: 'boolean', meta: { note: 'Viatura em operação' }, schema: { default_value: true } },
      { field: 'token', type: 'string', meta: { hidden: true, note: 'Token de ingestão do app/PWA do motorista (secreto)' } },
      // Última posição desnormalizada (atualizada a cada ping)
      { field: 'ultima_lat', type: 'float', meta: { note: 'Última latitude conhecida' } },
      { field: 'ultima_lng', type: 'float', meta: { note: 'Última longitude conhecida' } },
      { field: 'ultima_velocidade', type: 'float', meta: { note: 'km/h' } },
      { field: 'ultima_direcao', type: 'float', meta: { note: 'Heading 0-360°' } },
      { field: 'ultimo_ping', type: 'timestamp', meta: { note: 'Quando reportou posição pela última vez' } },
    ],
  },
  {
    collection: 'viatura_posicoes',
    meta: { icon: 'route', note: 'Rastro GPS das viaturas (time-series)' },
    fields: [
      { field: 'viatura_id', type: 'uuid', meta: { interface: 'select-dropdown-m2o', special: ['m2o'] } },
      { field: 'latitude', type: 'float', meta: { required: true }, schema: { is_nullable: false } },
      { field: 'longitude', type: 'float', meta: { required: true }, schema: { is_nullable: false } },
      { field: 'velocidade', type: 'float', meta: { note: 'km/h' } },
      { field: 'direcao', type: 'float', meta: { note: 'Heading 0-360°' } },
      { field: 'data_hora', type: 'timestamp', meta: { special: ['date-created'], readonly: true } },
    ],
  },
];

const relations = [
  { collection: 'viatura_posicoes', field: 'viatura_id', related_collection: 'viaturas', on_delete: 'CASCADE' },
];

async function criarColecao(def) {
  if (await collectionExists(def.collection)) {
    console.log(`• coleção ${def.collection} já existe`);
  } else {
    const payload = {
      collection: def.collection,
      meta: { ...def.meta },
      schema: {},
      fields: [{
        field: 'id', type: 'uuid',
        meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
        schema: { is_primary_key: true, length: 36, has_auto_increment: false },
      }],
    };
    const r = await api('POST', '/collections', payload);
    if (!r.ok) { console.error(`✗ ${def.collection}: ${JSON.stringify(r.json)}`); throw new Error('abortado'); }
    console.log(`✓ coleção ${def.collection} criada`);
  }
  for (const f of def.fields) {
    if (await fieldExists(def.collection, f.field)) { console.log(`    · ${def.collection}.${f.field} já existe`); continue; }
    const r = await api('POST', `/fields/${def.collection}`, f);
    console.log(r.ok ? `    ✓ ${def.collection}.${f.field}` : `    ✗ ${def.collection}.${f.field}: ${JSON.stringify(r.json)}`);
  }
}

async function criarRelation(rel) {
  if (await relationExists(rel.collection, rel.field)) { console.log(`• relation ${rel.collection}.${rel.field} já existe`); return; }
  const r = await api('POST', '/relations', {
    collection: rel.collection, field: rel.field, related_collection: rel.related_collection,
    meta: { sort_field: null }, schema: { on_delete: rel.on_delete || 'SET NULL' },
  });
  console.log(r.ok ? `✓ relation ${rel.collection}.${rel.field} → ${rel.related_collection}` : `✗ relation: ${JSON.stringify(r.json)}`);
}

// ---- Permissões de leitura para a Operadora ----
async function getVersaoMajor() {
  const { ok, json } = await api('GET', '/server/info');
  const major = parseInt(String(ok && json?.data?.version || '11').split('.')[0], 10);
  return Number.isFinite(major) ? major : 11;
}
async function acharPorNome(colecao, nome) {
  const { ok, json } = await api('GET', `/${colecao}?filter[name][_eq]=${encodeURIComponent(nome)}&limit=1`);
  return ok && json?.data?.length ? json.data[0] : null;
}

async function concederLeituraOperadora(major) {
  console.log('\n== Permissões (Operadora) ==');
  let target, campo;
  if (major >= 11) {
    const policy = await acharPorNome('policies', 'Operadora');
    if (!policy) { console.log('· policy "Operadora" não encontrada — rode bootstrap-rbac.mjs antes'); return; }
    target = { policy: policy.id }; campo = 'policy';
  } else {
    const role = await acharPorNome('roles', 'Operadora');
    if (!role) { console.log('· role "Operadora" não encontrada — rode bootstrap-rbac.mjs antes'); return; }
    target = { role: role.id }; campo = 'role';
  }
  const alvoId = target.policy ?? target.role;
  const { json } = await api('GET', `/permissions?filter[${campo}][_eq]=${alvoId}&limit=-1`);
  const existentes = new Set((json?.data ?? []).map((p) => `${p.collection}:${p.action}`));
  for (const col of ['viaturas', 'viatura_posicoes']) {
    const chave = `${col}:read`;
    if (existentes.has(chave)) { console.log(`    · ${chave} já existe`); continue; }
    const r = await api('POST', '/permissions', { ...target, collection: col, action: 'read', fields: ['*'], permissions: {}, validation: {} });
    console.log(r.ok ? `    ✓ ${chave}` : `    ✗ ${chave}: ${JSON.stringify(r.json)}`);
  }
}

async function main() {
  const ping = await api('GET', '/server/ping');
  if (!ping.ok) { console.error('✗ Directus inacessível.'); process.exit(1); }

  console.log('== Coleções de viaturas ==');
  for (const def of collections) await criarColecao(def);
  console.log('\n== Relations ==');
  for (const rel of relations) await criarRelation(rel);

  const major = await getVersaoMajor();
  await concederLeituraOperadora(major);

  console.log('\n✅ Bootstrap de viaturas concluído.');
}

main().catch((e) => { console.error('\n💥 Erro:', e.message); process.exit(1); });
