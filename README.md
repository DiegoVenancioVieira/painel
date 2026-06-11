# Painel SOS — Botão do Pânico

Painel administrativo web para operadoras monitorarem alertas de emergência em
tempo real: lista de alertas, mapa com localização e rastro, áudio do incidente,
contatos de guardiões e resolução de ocorrências.

## Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS**
- **@directus/sdk** + REST API do Directus
- **react-leaflet** / OpenStreetMap (mapas)

## Pré-requisitos

- Node.js 18+ (testado em 20)
- Uma instância do **Directus** com o schema provisionado (ver scripts abaixo)

## Configuração

1. Copie `.env.example` para `.env.local` e preencha:

   ```env
   NEXT_PUBLIC_DIRECTUS_URL=http://192.168.0.118:8056
   DIRECTUS_TOKEN=seu_token_admin            # SERVER-SIDE apenas
   SESSION_SECRET=um_valor_aleatorio_longo
   ```

   > ⚠️ `DIRECTUS_TOKEN` é o token admin e **só** é usado no servidor
   > (route handlers / proxy de assets). Nunca é exposto ao browser.

2. Instale as dependências:

   ```bash
   npm install
   ```

## Provisionamento do Directus

Execute uma vez (ordem importa):

```bash
npm run bootstrap:db        # cria coleções, campos e relations
npm run bootstrap:rbac      # campos de resolução + role/policy "Operadora" + usuária de teste
npm run bootstrap:viaturas  # coleções viaturas/viatura_posicoes (+ token) + permissões
npm run bootstrap:despachos # coleção despachos (alerta ↔ viatura) + permissões
npm run seed                # dados de exemplo de alertas (opcional)
npm run seed:viaturas       # 3 viaturas de exemplo + tokens de ingestão (opcional)
```

Para simular o movimento das viaturas no mapa (substitui o app/PWA do motorista
durante o teste):

```bash
node simulate-viaturas.mjs              # contínuo (Ctrl+C para parar)
TICKS=20 INTERVALO=4 node simulate-viaturas.mjs
```

A operadora de teste criada pelo `bootstrap:rbac`:

- **e-mail:** `operadora@painel-sos.com`
- **senha:** `Operadora#2026`

(Personalize com as variáveis `OPERADORA_EMAIL` / `OPERADORA_SENHA`.)

## Rodar

```bash
npm run dev      # http://localhost:3000
npm run build    # build de produção
npm start        # servir build
```

## Schema (Directus)

| Coleção | Campos |
|---|---|
| `usuarias` | `id`, `nome`, `telefone`, `validada`, `data_criacao` |
| `guardioes` | `id`, `usuaria_id → usuarias`, `nome`, `telefone` |
| `alertas` | `id`, `usuaria_id → usuarias`, `status` (`ativo`/`resolvido`/`teste`), `latitude_inicial`, `longitude_inicial`, `audio → directus_files`, `sincronizado_offline`, `data_criacao`, `resolvido_por → directus_users`, `data_resolucao` |
| `localizacoes_alerta` | `id`, `alerta_id → alertas` (CASCADE), `latitude`, `longitude`, `data_hora` |
| `viaturas` | `id`, `identificador`, `tipo` (`PM`/`GCM`/`parceira`), `placa`, `telefone_contato`, `ativa`, `ultima_lat`, `ultima_lng`, `ultima_velocidade`, `ultima_direcao`, `ultimo_ping` |
| `viatura_posicoes` | `id`, `viatura_id → viaturas` (CASCADE), `latitude`, `longitude`, `velocidade`, `direcao`, `data_hora` |
| `despachos` | `id`, `alerta_id → alertas` (CASCADE), `viatura_id → viaturas`, `status` (`designada`/`a_caminho`/`no_local`/`encerrada`), `observacao`, `data_designacao`, `data_chegada` |

> A última posição é desnormalizada em `viaturas` (lida direto pelo mapa, rápido);
> `viatura_posicoes` guarda o rastro/histórico. Em produção, o app/PWA do motorista
> chamará um endpoint de ingestão que atualiza ambos — o mesmo que `simulate-viaturas.mjs`
> faz no teste.

## Arquitetura

- **Autenticação**: login via `/auth/login` do Directus; tokens guardados em
  **cookies httpOnly** (`src/lib/session.ts`). `src/middleware.ts` protege todas as
  rotas exceto `/login`. Refresh automático em `src/lib/server-api.ts`.
- **Dados**: o browser nunca fala direto com o Directus para dados sensíveis —
  passa pelos route handlers em `src/app/api/*`, que usam o token da sessão da
  operadora (com refresh) ou, no proxy de áudio, o token admin server-side.
- **Tempo real**: `useAlertasRealtime` faz polling do endpoint autenticado a cada
  10s, detecta novos alertas ativos, dispara som + toast e atualiza o indicador de
  conexão no header.

### Ingestão de GPS das viaturas (app/PWA do motorista)

Cada viatura tem um `token` secreto (gerado pelo `seed:viaturas`). O app do motorista
envia a posição para:

```
POST /api/viaturas/{id}/ping
Authorization: Bearer <token-da-viatura>
Content-Type: application/json

{ "latitude": -23.56, "longitude": -46.65, "velocidade": 42, "direcao": 120 }
```

O endpoint valida o token contra a viatura e grava no Directus usando o token admin
**server-side** (que nunca chega ao app). Atualiza a última posição e registra um
ponto em `viatura_posicoes`. Esse endpoint é isento do middleware de sessão
(autentica por token próprio). O script `simulate-viaturas.mjs` reproduz isso no teste.

### Despacho

No detalhe de um alerta, o painel lista as **viaturas mais próximas** (distância
haversine) e permite **designar** uma. Cada despacho tem status
(`designada → a_caminho → no_local → encerrada`); marcar `no_local` registra a
hora de chegada.

### Por que polling e não WebSocket?

O WebSocket do Directus exige enviar um token de acesso ao cliente. Como a sessão
usa cookies **httpOnly** (o token não é legível por JS, por segurança), o polling
via proxy server é a opção robusta. Para habilitar WebSocket, gere um token de
escopo reduzido (somente leitura de `alertas`/`localizacoes_alerta`), exponha-o ao
cliente e troque a implementação de `useAlertasRealtime` por `subscribe` do SDK.

## Estrutura

```
src/
  app/
    (painel)/            # área autenticada (layout com header + providers)
      page.tsx           # dashboard
      alertas/[id]/      # detalhe do alerta
      mapa/              # mapa geral de ativos
    api/                 # route handlers (auth, alertas, assets)
    login/               # tela de login
  components/            # UI (cards, mapa, player, toast, etc.)
  hooks/                 # useAlertasRealtime
  lib/                   # directus, sessão, formatação, som
  types/schema.ts        # tipos do schema
bootstrap-directus.mjs   # provisiona schema
bootstrap-rbac.mjs       # RBAC + campos de resolução + usuária de teste
seed-directus.mjs        # dados de exemplo
```
