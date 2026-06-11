# Prompts — Painel Web Admin (SOS Botão do Pânico)

Sequência de prompts para implementar o painel administrativo com **Claude Code**.
Execute um prompt por vez, na ordem. Cada um assume que o anterior foi concluído.

## Contexto fixo (cole no topo da primeira sessão ou no CLAUDE.md)

```
Projeto: painel web administrativo do app "Botão do Pânico" (SOS para mulheres).
Stack: Next.js (App Router) + React + TypeScript + Tailwind CSS + @directus/sdk.
Backend: Directus já provisionado em http://192.168.0.118:8056 (REST + WebSocket).

Schema do Directus (coleções e campos):
- usuarias: id (uuid, PK), nome, telefone, validada (bool), data_criacao
- guardioes: id (uuid, PK), usuaria_id (m2o -> usuarias), nome, telefone
- alertas: id (uuid, PK), usuaria_id (m2o -> usuarias), status ('ativo'|'resolvido'|'teste'),
  latitude_inicial (float), longitude_inicial (float), audio (uuid -> directus_files),
  sincronizado_offline (bool), data_criacao
- localizacoes_alerta: id (uuid, PK), alerta_id (m2o -> alertas), latitude, longitude, data_hora
  (on_delete CASCADE — rastro some quando o alerta é apagado)

Objetivo do painel: operadoras monitoram alertas em tempo real, veem a localização
no mapa (ponto inicial + rastro), ouvem o áudio do incidente, veem dados da usuária
e seus guardiões, e marcam alertas como resolvidos.

Idioma da UI: português (Brasil).
```

---

## Prompt 1 — Scaffold do projeto

```
Crie um projeto Next.js (App Router) + TypeScript + Tailwind CSS neste diretório.
Configure:
- ESLint + Prettier.
- Variáveis de ambiente em .env.local: NEXT_PUBLIC_DIRECTUS_URL=http://192.168.0.118:8056
  e DIRECTUS_TOKEN (token admin, usado só no server). Crie também .env.example.
- Adicione @directus/sdk como dependência.
- Crie src/lib/directus.ts com duas instâncias do SDK:
  (1) cliente server-side autenticado com staticToken(DIRECTUS_TOKEN);
  (2) helper para cliente client-side autenticado por login da operadora (preparar, sem usar ainda).
- Defina os tipos TypeScript do schema (Usuaria, Guardiao, Alerta, LocalizacaoAlerta)
  num arquivo src/types/schema.ts, refletindo exatamente os campos acima.
- Layout raiz com Tailwind, fonte legível, tema claro, header "Painel SOS".
Garanta que `npm run dev` sobe sem erros e mostre a home placeholder.
```

---

## Prompt 2 — Autenticação da operadora

```
Implemente login das operadoras usando o auth do Directus (POST /auth/login).
- Página /login com formulário (email + senha), validação e mensagens de erro em português.
- Use o SDK Directus no client com authentication('json') para login; armazene o
  access_token/refresh_token de forma segura (httpOnly cookie via route handler em
  src/app/api/auth, NÃO em localStorage).
- Middleware (src/middleware.ts) que protege todas as rotas exceto /login: sem sessão
  válida -> redireciona para /login.
- Botão "Sair" no header que faz logout e limpa os cookies.
- Refresh automático do token quando expirar.
NÃO peça para criar contas no painel — operadoras são criadas no Directus admin.
```

---

## Prompt 3 — Lista de alertas ativos (dashboard)

```
Crie o dashboard em / listando os alertas.
- Busque alertas via Directus, com expand/fields para trazer dados da usuária
  (usuaria_id.nome, usuaria_id.telefone). Ordene por data_criacao desc.
- Abas/filtro por status: "Ativos" (padrão), "Resolvidos", "Testes", "Todos".
- Cada card de alerta mostra: nome da usuária, telefone, horário (relativo + absoluto),
  badge de status colorido, ícone se sincronizado_offline=true, e botão "Abrir".
- Alertas com status 'ativo' devem ter destaque visual forte (cor de alerta, borda).
- Estado vazio amigável quando não houver alertas.
- Paginação ou scroll infinito (limit 25).
Mantenha a busca no server (route handler ou server component) usando o token admin.
```

---

## Prompt 4 — Tempo real (WebSocket / polling)

```
Adicione atualização em tempo real ao dashboard.
- Use o WebSocket do Directus (ws://192.168.0.118:8056/websocket) com subscribe na
  coleção "alertas" para receber create/update ao vivo. Autentique o socket com o token.
- Quando chegar um alerta novo com status 'ativo': inserir no topo da lista, tocar um
  som de alerta curto e mostrar uma notificação visual (toast).
- Quando um alerta for atualizado (ex.: resolvido), refletir na lista sem recarregar.
- Fallback: se o WebSocket não conectar, faça polling a cada 10s.
- Indicador de conexão no header (online/reconectando).
Encapsule numa hook useAlertasRealtime().
```

---

## Prompt 5 — Detalhe do alerta + mapa + áudio

```
Crie a página /alertas/[id] com o detalhe completo de um alerta.
- Dados da usuária (nome, telefone, validada) e lista de guardiões dela
  (buscar guardioes onde usuaria_id = usuaria do alerta), com botões de ligar (tel:)
  e WhatsApp (https://wa.me/).
- Mapa com react-leaflet (OpenStreetMap):
  * marcador do ponto inicial (latitude_inicial/longitude_inicial);
  * rastro (polyline) com os pontos de localizacoes_alerta do alerta, ordenados por data_hora;
  * marcador da última posição conhecida, destacado;
  * auto-fit dos bounds para enquadrar todo o trajeto.
- Player de áudio: o campo `audio` é um uuid de directus_files; monte a URL
  /assets/{audio}?access_token=... (use o token via proxy server para não vazar o admin).
- Metadados: data_criacao, status, sincronizado_offline.
- Botão "Marcar como resolvido" (Prompt 6).
Se o alerta estiver ativo, o mapa e o rastro também devem atualizar em tempo real
(subscribe em localizacoes_alerta com filter alerta_id = id).
```

---

## Prompt 6 — Ações: resolver alerta

```
Implemente a ação de resolver um alerta.
- Botão "Marcar como resolvido" na página de detalhe e (opcional) no card da lista.
- Abre um modal de confirmação em português; ao confirmar, faz PATCH no alerta
  setando status='resolvido' via route handler server-side.
- Estado de loading/sucesso/erro com toast. Atualiza a UI otimisticamente e confirma
  pelo evento de tempo real.
- Registre quem resolveu e quando: adicione (se ainda não existir) os campos
  `resolvido_por` (m2o -> directus_users) e `data_resolucao` (timestamp) à coleção
  alertas via API do Directus, e preencha-os no PATCH. Atualize os tipos TS.
```

---

## Prompt 7 — Polimento, mapa de calor e responsividade

```
Refino final do painel:
- Visão geral opcional em /mapa: todos os alertas ativos plotados num mapa único.
- Responsividade: usável em tablet (operadora em plantão) e desktop.
- Acessibilidade: contraste, foco visível, labels ARIA, navegação por teclado.
- Tratamento de erros de rede com retry e mensagens claras.
- Skeletons de carregamento.
- Som de alerta configurável (ligar/desligar, volume) com persistência por operadora.
- README.md com instruções de setup (env, npm install, npm run dev) e descrição do schema.
```

---

## Notas

- **Segurança**: o token admin do Directus só deve ser usado em código server-side
  (route handlers / server components). Nunca exponha `DIRECTUS_TOKEN` no client —
  o front usa a sessão da operadora ou um proxy server.
- **Permissões/RBAC**: ainda não configuramos roles no Directus. Antes de produção,
  crie um role "operadora" com permissão de leitura nas coleções e update apenas do
  campo status/resolução em `alertas`. (Pode virar um próximo passo de bootstrap.)
- Ajuste a ordem se quiser um MVP mais rápido: Prompts 1 → 3 → 5 já entregam um painel
  navegável (sem login/tempo real), úteis para validar a integração com o Directus.
```
