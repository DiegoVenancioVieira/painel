#!/usr/bin/env node
/**
 * Bootstrap de RBAC para o Painel SOS.
 *
 * 1. Adiciona à coleção `alertas` os campos `data_resolucao` (timestamp) e
 *    `resolvido_por` (m2o -> directus_users), usados ao resolver alertas.
 * 2. Cria um papel "Operadora" com uma policy de permissões mínimas:
 *      - leitura: usuarias, guardioes, alertas, localizacoes_alerta
 *      - update em alertas apenas dos campos status/data_resolucao/resolvido_por
 *      - leitura do próprio usuário (directus_users) para /users/me
 * 3. Cria uma operadora de teste (se ainda não existir) e imprime as credenciais.
 *
 * Idempotente. Detecta Directus 10 (permissões por role) vs 11+ (policies).
 *
 * Uso:
 *   DIRECTUS_URL=... DIRECTUS_TOKEN=... node bootstrap-rbac.mjs
 */

import { URL, TOKEN } from './env.mjs';

const OPERADORA_EMAIL = process.env.OPERADORA_EMAIL || 'operadora@painel-sos.com';
const OPERADORA_SENHA = process.env.OPERADORA_SENHA || 'Operadora#2026';

async function api(method, path, body) {
  const res = await fetch(`${URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { ok: res.ok, status: res.status, json };
}

const COLECOES_LEITURA = ['usuarias', 'guardioes', 'alertas', 'localizacoes_alerta'];

async function getVersaoMajor() {
  const { ok, json } = await api('GET', '/server/info');
  const v = ok && json?.data?.version ? String(json.data.version) : '';
  const major = parseInt(v.split('.')[0], 10);
  return Number.isFinite(major) ? major : 11;
}

// ---- Passo 1: campos de resolução -----------------------------------------
async function fieldExists(collection, field) {
  const { ok } = await api('GET', `/fields/${collection}/${field}`);
  return ok;
}

async function garantirCamposResolucao() {
  console.log('\n== Campos de resolução em alertas ==');
  if (!(await fieldExists('alertas', 'data_resolucao'))) {
    const r = await api('POST', '/fields/alertas', {
      field: 'data_resolucao', type: 'timestamp',
      meta: { interface: 'datetime', readonly: false, note: 'Quando o alerta foi resolvido' },
    });
    console.log(r.ok ? '✓ campo alertas.data_resolucao criado' : `✗ data_resolucao: ${JSON.stringify(r.json)}`);
  } else console.log('· alertas.data_resolucao já existe');

  if (!(await fieldExists('alertas', 'resolvido_por'))) {
    // cria o campo uuid + relation para directus_users
    const f = await api('POST', '/fields/alertas', {
      field: 'resolvido_por', type: 'uuid',
      meta: { interface: 'select-dropdown-m2o', special: ['m2o'], note: 'Operadora que resolveu' },
    });
    if (!f.ok) { console.log(`✗ resolvido_por: ${JSON.stringify(f.json)}`); }
    else {
      const rel = await api('POST', '/relations', {
        collection: 'alertas', field: 'resolvido_por', related_collection: 'directus_users',
        schema: { on_delete: 'SET NULL' }, meta: { sort_field: null },
      });
      console.log(rel.ok ? '✓ campo+relation alertas.resolvido_por → directus_users' : `✗ relation: ${JSON.stringify(rel.json)}`);
    }
  } else console.log('· alertas.resolvido_por já existe');
}

// ---- Passo 2: role + permissões -------------------------------------------
function regrasPermissao(target) {
  // target = { policy } (v11) ou { role } (v10)
  const perms = [];
  for (const col of COLECOES_LEITURA) {
    perms.push({ ...target, collection: col, action: 'read', fields: ['*'], permissions: {}, validation: {} });
  }
  // update em alertas, somente campos de resolução
  perms.push({
    ...target, collection: 'alertas', action: 'update',
    fields: ['status', 'data_resolucao', 'resolvido_por'], permissions: {}, validation: {},
  });
  // leitura do próprio usuário
  perms.push({
    ...target, collection: 'directus_users', action: 'read',
    fields: ['id', 'first_name', 'last_name', 'email', 'status', 'role'],
    permissions: { id: { _eq: '$CURRENT_USER' } }, validation: {},
  });
  return perms;
}

async function acharPorNome(colecao, nome) {
  const { ok, json } = await api('GET', `/${colecao}?filter[name][_eq]=${encodeURIComponent(nome)}&limit=1`);
  return ok && json?.data?.length ? json.data[0] : null;
}

async function criarRBAC(major) {
  console.log(`\n== RBAC (Directus v${major}) ==`);

  // Role
  let role = await acharPorNome('roles', 'Operadora');
  if (!role) {
    const r = await api('POST', '/roles', {
      name: 'Operadora',
      icon: 'support_agent',
      description: 'Operadoras de plantão do Painel SOS',
      ...(major < 11 ? { app_access: true, admin_access: false, enforce_tfa: false } : {}),
    });
    if (!r.ok) { console.error(`✗ role: ${JSON.stringify(r.json)}`); throw new Error('rbac'); }
    role = r.json.data;
    console.log('✓ role "Operadora" criada');
  } else console.log('· role "Operadora" já existe');

  if (major >= 11) {
    // Policy
    let policy = await acharPorNome('policies', 'Operadora');
    if (!policy) {
      const p = await api('POST', '/policies', {
        name: 'Operadora',
        icon: 'support_agent',
        description: 'Permissões das operadoras',
        app_access: true,
        admin_access: false,
        enforce_tfa: false,
      });
      if (!p.ok) { console.error(`✗ policy: ${JSON.stringify(p.json)}`); throw new Error('rbac'); }
      policy = p.json.data;
      console.log('✓ policy "Operadora" criada');
    } else console.log('· policy "Operadora" já existe');

    // Vincula policy ao role (directus_access)
    const acc = await api('GET', `/access?filter[role][_eq]=${role.id}&filter[policy][_eq]=${policy.id}&limit=1`);
    if (!(acc.ok && acc.json?.data?.length)) {
      const a = await api('POST', '/access', { role: role.id, policy: policy.id });
      console.log(a.ok ? '✓ policy vinculada ao role' : `✗ access: ${JSON.stringify(a.json)}`);
    } else console.log('· policy já vinculada ao role');

    await criarPermissoes(major, { policy: policy.id });
    return role;
  }

  await criarPermissoes(major, { role: role.id });
  return role;
}

async function criarPermissoes(major, target) {
  // Lê permissões já existentes para o alvo
  const campoAlvo = major >= 11 ? 'policy' : 'role';
  const alvoId = target.policy ?? target.role;
  const { json } = await api('GET', `/permissions?filter[${campoAlvo}][_eq]=${alvoId}&limit=-1`);
  const existentes = new Set((json?.data ?? []).map((p) => `${p.collection}:${p.action}`));

  for (const perm of regrasPermissao(target)) {
    const chave = `${perm.collection}:${perm.action}`;
    if (existentes.has(chave)) { console.log(`    · permissão ${chave} já existe`); continue; }
    const r = await api('POST', '/permissions', perm);
    console.log(r.ok ? `    ✓ permissão ${chave}` : `    ✗ ${chave}: ${JSON.stringify(r.json)}`);
  }
}

// ---- Passo 3: operadora de teste ------------------------------------------
async function criarOperadoraTeste(role) {
  console.log('\n== Operadora de teste ==');
  const { json } = await api('GET', `/users?filter[email][_eq]=${encodeURIComponent(OPERADORA_EMAIL)}&limit=1`);
  if (json?.data?.length) {
    console.log(`· usuária ${OPERADORA_EMAIL} já existe`);
    return;
  }
  const r = await api('POST', '/users', {
    email: OPERADORA_EMAIL,
    password: OPERADORA_SENHA,
    first_name: 'Operadora',
    last_name: 'Teste',
    role: role.id,
    status: 'active',
  });
  if (!r.ok) { console.error(`✗ usuária: ${JSON.stringify(r.json)}`); return; }
  console.log('✓ operadora de teste criada');
  console.log(`    e-mail: ${OPERADORA_EMAIL}`);
  console.log(`    senha:  ${OPERADORA_SENHA}`);
}

async function main() {
  const ping = await api('GET', '/server/ping');
  if (!ping.ok) { console.error('✗ Directus inacessível.'); process.exit(1); }
  const major = await getVersaoMajor();

  await garantirCamposResolucao();
  const role = await criarRBAC(major);
  await criarOperadoraTeste(role);

  console.log('\n✅ RBAC concluído.');
}

main().catch((e) => { console.error('\n💥 Erro:', e.message); process.exit(1); });
