# Deploy do Painel SOS no Coolify

Domínio: **https://sosmulher-sermulher.aracaju.se.gov.br**
Encaminhamento da borda gov: domínio (HTTPS) → `http://192.168.0.118:3010` (TLS terminado na borda).

## Arquitetura (contexto)

```
App mulher (APK)  ─┐
App viatura (APK) ─┤→  PAINEL (Next.js, este projeto)  →  Directus (192.168.0.118:8056, interno)
Browser operadora ─┘     /api/* faz proxy server-side
```

O Directus **não** precisa ser exposto publicamente: login, dados e áudio passam
por proxy no painel. Só o painel fica no domínio público.

## 1. Pré-requisitos

- Directus rodando e alcançável em `http://192.168.0.118:8056` a partir do
  container do Coolify (mesma rede / rota válida).
- Schema do Directus já provisionado (ver `README.md` → bootstrap/seed).
- Repositório no GitHub: `DiegoVenancioVieira/painel`, branch `main`.

## 2. Criar o recurso no Coolify

1. **New Resource → Application → Public/Private Repository.**
2. Repositório: `https://github.com/DiegoVenancioVieira/painel`, branch `main`.
3. **Build Pack: Dockerfile** (o `Dockerfile` deste repo já gera a saída
   `standalone` do Next; imagem final pequena, roda `node server.js` na porta 3000).

## 3. Variáveis de ambiente

Cadastrar em *Environment Variables* (ver `.env.coolify.example`):

| Variável | Valor | Observação |
|---|---|---|
| `DIRECTUS_URL` | `http://192.168.0.118:8056` | server-side, não vai ao browser |
| `DIRECTUS_TOKEN` | *(token admin)* | marcar como **secret** |
| `SESSION_SECRET` | *(gerar novo)* | `openssl rand -hex 32` |
| `NODE_ENV` | `production` | ativa cookies `secure` |
| `PORT` | `3000` | porta interna do container |

> ⚠️ Não cadastre `NEXT_PUBLIC_DIRECTUS_URL` (evita embutir o IP interno no
> bundle do browser). O código já prioriza `DIRECTUS_URL`.

## 4. Domínio e porta

A borda gov aponta o domínio para `192.168.0.118:3010`. Então exponha o app na
porta **3010** do host:

- **Ports Mappings:** `3010:3000` (host:container).
- **Domains / FQDN:** `https://sosmulher-sermulher.aracaju.se.gov.br`
  (usado pelo Coolify para gerar URLs; o TLS real é terminado na borda gov).

O app recebe HTTP na 3010 — **ok**: o cookie de sessão usa `secure` baseado em
`NODE_ENV=production` (o atributo é enviado ao browser, que acessa via HTTPS).
Não há outra lógica sensível a esquema.

> Se a borda gov puder apontar para a porta padrão do proxy do Coolify (80/443)
> em vez de 3010, o Traefik do Coolify assume o roteamento por FQDN e o mapeamento
> `3010:3000` deixa de ser necessário. Use uma das duas abordagens, não as duas.

## 5. Deploy

1. **Deploy** no Coolify (build da imagem → container na 3000 → exposto na 3010).
2. Testar pela borda: `https://sosmulher-sermulher.aracaju.se.gov.br`
   - tela de login carrega;
   - login da operadora (`operadora@painel-sos.com`) funciona (valida cookie/HTTPS);
   - dashboard e mapa carregam (proxy → Directus ok).

## 6. Demos Flutter Web em /mulher e /viatura

Os apps `mulher` e `viatura` são Flutter (mobile). Para **demonstração**, foram
compilados como Flutter **Web** e embutidos no próprio painel:

- `public/mulher/`  → servido em `https://.../mulher`
- `public/viatura/` → servido em `https://.../viatura`

Como funciona no painel:
- `next.config.mjs` faz *rewrite* de `/mulher` e `/viatura` para o respectivo
  `index.html`; os assets são servidos direto de `/public`.
- `src/middleware.ts` isenta essas rotas da proteção de sessão.
- Build feito com `flutter build web --release --base-href /mulher/` (e
  `/viatura/`); `defaultBaseUrl` já aponta para o domínio (API same-origin).

Para **regerar** os demos após mudar os apps:

```bash
cd mulher  && flutter build web --release --base-href /mulher/
cd ../viatura && flutter build web --release --base-href /viatura/
# copie build/web → painel/public/mulher e painel/public/viatura
```

> ⚠️ **Limitações da demo web** (por isso é só demo): gravação de áudio e GPS em
> segundo plano não funcionam de forma confiável no navegador; `path_provider`
> não tem suporte web (o fluxo de áudio do pânico pode falhar em runtime). Para
> uso real, distribua os **APKs** (Android) / build iOS — aí remova
> `usesCleartextTraffic`/`NSAllowsArbitraryLoads` e rebuild com
> `flutter build apk --release`.

## 7. Pendências de segurança antes de produção

- `SESSION_SECRET` novo e forte (o de dev é `...change-me...`).
- Validação de telefone por SMS no cadastro da usuária (hoje `validada: false`).
- GPS/áudio em background exigem foreground service (Android) / background
  location (iOS) — hoje só com app aberto.

## Notas

- `.env.local` é só para desenvolvimento/scripts de bootstrap; **não** entra na
  imagem (está no `.dockerignore`).
- Os scripts `bootstrap-*.mjs` / `seed-*.mjs` rodam manualmente contra o Directus
  (uma vez), não fazem parte do runtime do container.
