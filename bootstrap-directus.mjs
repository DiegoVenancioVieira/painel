#!/usr/bin/env node
/**
 * Bootstrap do schema do Directus para o app "Botão do Pânico".
 *
 * Provisiona as coleções: usuarias, guardioes, alertas, localizacoes_alerta
 * e cria as relations (chaves estrangeiras) entre elas.
 *
 * Idempotente: pode ser executado várias vezes. Coleções/campos/relations
 * que já existem são pulados (não sobrescreve dados).
 *
 * Uso:
 *   DIRECTUS_URL=https://seu-directus.exemplo.com \
 *   DIRECTUS_TOKEN=seu_token_admin \
 *   node bootstrap-directus.mjs
 *
 * Requer Node 18+ (usa fetch nativo).
 */

const URL = (process.env.DIRECTUS_URL || 'http://192.168.0.118:8056').replace(/\/+$/, '');
const TOKEN = process.env.DIRECTUS_TOKEN || 'csz_fZjTCHKwDaDo_95lZ03-ad_AvXZY';

if (!URL || !TOKEN) {
  console.error('ERRO: defina DIRECTUS_URL e DIRECTUS_TOKEN no ambiente.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helper de requisição
// ---------------------------------------------------------------------------
async function api(method, path, body) {
  const res = await fetch(`${URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  return { ok: res.ok, status: res.status, json };
}

async function collectionExists(name) {
  const { ok } = await api('GET', `/collections/${name}`);
  return ok;
}

async function fieldExists(collection, field) {
  const { ok } = await api('GET', `/fields/${collection}/${field}`);
  return ok;
}

async function relationExists(collection, field) {
  const { ok } = await api('GET', `/relations/${collection}/${field}`);
  return ok;
}

// ---------------------------------------------------------------------------
// Definição do schema
//
// Cada coleção é criada já com o campo `id` (PK uuid auto-gerada).
// Os demais campos são adicionados via /fields para controle fino do schema.
// ---------------------------------------------------------------------------
const collections = [
  {
    collection: 'usuarias',
    meta: { icon: 'person', note: 'Perfis das usuárias do aplicativo Botão do Pânico' },
    fields: [
      { field: 'nome', type: 'string', meta: { required: true }, schema: { is_nullable: false } },
      { field: 'telefone', type: 'string', meta: { required: true }, schema: { is_nullable: false } },
      { field: 'validada', type: 'boolean', meta: { note: 'Telefone validado' }, schema: { default_value: false } },
      { field: 'data_criacao', type: 'timestamp', meta: { special: ['date-created'], readonly: true } },
    ],
  },
  {
    collection: 'guardioes',
    meta: { icon: 'group', note: 'Contatos de emergência cadastrados pelas usuárias' },
    fields: [
      { field: 'usuaria_id', type: 'uuid', meta: { interface: 'select-dropdown-m2o', special: ['m2o'] } },
      { field: 'nome', type: 'string', meta: { required: true }, schema: { is_nullable: false } },
      { field: 'telefone', type: 'string', meta: { required: true }, schema: { is_nullable: false } },
    ],
  },
  {
    collection: 'alertas',
    meta: { icon: 'warning', note: 'Registro central de alertas emitidos pelas usuárias' },
    fields: [
      { field: 'usuaria_id', type: 'uuid', meta: { interface: 'select-dropdown-m2o', special: ['m2o'] } },
      {
        field: 'status',
        type: 'string',
        meta: { note: 'ativo, resolvido, teste' },
        schema: { default_value: 'ativo' },
      },
      { field: 'latitude_inicial', type: 'float', meta: {} },
      { field: 'longitude_inicial', type: 'float', meta: {} },
      {
        field: 'audio',
        type: 'uuid',
        meta: { interface: 'file', special: ['file'], note: 'Gravação de áudio do incidente' },
      },
      {
        field: 'sincronizado_offline',
        type: 'boolean',
        meta: { note: 'True se o alerta foi sincronizado após falha de rede' },
        schema: { default_value: false },
      },
      { field: 'data_criacao', type: 'timestamp', meta: { special: ['date-created'], readonly: true } },
    ],
  },
  {
    collection: 'localizacoes_alerta',
    meta: { icon: 'my_location', note: 'Rastreamento contínuo de localização durante um alerta ativo' },
    fields: [
      { field: 'alerta_id', type: 'uuid', meta: { interface: 'select-dropdown-m2o', special: ['m2o'] } },
      { field: 'latitude', type: 'float', meta: { required: true }, schema: { is_nullable: false } },
      { field: 'longitude', type: 'float', meta: { required: true }, schema: { is_nullable: false } },
      { field: 'data_hora', type: 'timestamp', meta: { special: ['date-created'], readonly: true } },
    ],
  },
];

// Relations (chaves estrangeiras). O campo m2o já foi criado acima como uuid.
const relations = [
  { collection: 'guardioes', field: 'usuaria_id', related_collection: 'usuarias', on_delete: 'SET NULL' },
  { collection: 'alertas', field: 'usuaria_id', related_collection: 'usuarias', on_delete: 'SET NULL' },
  { collection: 'localizacoes_alerta', field: 'alerta_id', related_collection: 'alertas', on_delete: 'CASCADE' },
];

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------
async function createCollection(def) {
  if (await collectionExists(def.collection)) {
    console.log(`• coleção ${def.collection} já existe — pulando criação`);
  } else {
    const payload = {
      collection: def.collection,
      meta: { ...def.meta },
      schema: {}, // schema vazio = tabela real (não folder)
      // PK uuid auto-gerada
      fields: [
        {
          field: 'id',
          type: 'uuid',
          meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
          schema: { is_primary_key: true, length: 36, has_auto_increment: false },
        },
      ],
    };
    const { ok, status, json } = await api('POST', '/collections', payload);
    if (!ok) {
      console.error(`✗ falha ao criar coleção ${def.collection} (HTTP ${status}):`, JSON.stringify(json));
      throw new Error('abortado');
    }
    console.log(`✓ coleção ${def.collection} criada`);
  }

  // Campos
  for (const f of def.fields) {
    if (await fieldExists(def.collection, f.field)) {
      console.log(`    · campo ${def.collection}.${f.field} já existe — pulando`);
      continue;
    }
    const { ok, status, json } = await api('POST', `/fields/${def.collection}`, f);
    if (!ok) {
      console.error(`    ✗ falha no campo ${def.collection}.${f.field} (HTTP ${status}):`, JSON.stringify(json));
      throw new Error('abortado');
    }
    console.log(`    ✓ campo ${def.collection}.${f.field} criado`);
  }
}

async function createRelation(rel) {
  if (await relationExists(rel.collection, rel.field)) {
    console.log(`• relation ${rel.collection}.${rel.field} → ${rel.related_collection} já existe — pulando`);
    return;
  }
  const payload = {
    collection: rel.collection,
    field: rel.field,
    related_collection: rel.related_collection,
    meta: { sort_field: null },
    schema: { on_delete: rel.on_delete || 'SET NULL' },
  };
  const { ok, status, json } = await api('POST', '/relations', payload);
  if (!ok) {
    console.error(`✗ falha na relation ${rel.collection}.${rel.field} (HTTP ${status}):`, JSON.stringify(json));
    throw new Error('abortado');
  }
  console.log(`✓ relation ${rel.collection}.${rel.field} → ${rel.related_collection} criada`);
}

async function main() {
  console.log(`Conectando em ${URL} ...`);
  const ping = await api('GET', '/server/ping');
  if (!ping.ok) {
    console.error(`✗ não foi possível alcançar o Directus (HTTP ${ping.status}). Verifique URL/token.`);
    process.exit(1);
  }

  console.log('\n== Criando coleções e campos ==');
  for (const def of collections) {
    await createCollection(def);
  }

  console.log('\n== Criando relations (chaves estrangeiras) ==');
  for (const rel of relations) {
    await createRelation(rel);
  }

  console.log('\n✅ Bootstrap concluído.');
}

main().catch((err) => {
  console.error('\n💥 Erro:', err.message);
  process.exit(1);
});
