# ⚙️ Tudo que você precisa fazer FORA do código

> Guia de **contas, painéis, cliques e credenciais** — nada aqui é programar.
> Cada item diz: **o que é → passo a passo → onde pegar → onde colar → como conferir.**
>
> **Legenda:** 🔴 bloqueia vender de verdade · 🟠 importante · 🟡 opcional · ✅ já feito por mim

---

## 🗺️ Mapa rápido: credencial → onde colar

| Credencial / config | Onde vai |
|---|---|
| `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` | `backend/.env` **+** variáveis da hospedagem |
| `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASS`, `EMAIL_REMETENTE` | `backend/.env` **+** variáveis da hospedagem |
| `JWT_SECRET` (forte, um por ambiente) | ✅ local já feito · gerar outro para a hospedagem |
| `DB_HOST/PORT/USER/PASSWORD/NAME` | ✅ local já feito · usar os do banco gerenciado |
| `CLIENTE_ORIGEM`, `BACKEND_URL`, `TRUST_PROXY`, `NODE_ENV` | variáveis da hospedagem |
| `VITE_API_URL` | GitHub → Settings → Secrets and variables → **Actions → Variables** |
| `GOOGLE_CLIENT_ID` | `frontend/src/components/pages/Perfil.jsx` (linha do placeholder) |
| `ADMIN_EMAIL` / `ADMIN_SENHA` / `ADMIN_NOME` | `backend/.env` (antes do `npm run seed:admin`) |

**✅ Já está pronto (não precisa fazer de novo):** `JWT_SECRET` forte local + travas que impedem produção mal configurada, headers de segurança (helmet), CI no GitHub Actions, Dockerfile + docker-compose, checkout exigindo login, código de verificação de 4–6 dígitos, banco local no ar (`lume-db`).

---

## 1. 💳 Mercado Pago — receber dinheiro de verdade 🔴

**O que é:** sem o Access Token o pedido é salvo como `simulado` e **nenhum valor é cobrado** (é o que acontece hoje).

1. **Crie a conta**: https://www.mercadopago.com.br/registro — use CPF ou CNPJ; para produção a conta precisa estar **verificada** (comprovante de residência/identidade).
2. **Painel de desenvolvedores**: https://www.mercadopago.com.br/developers/panel/app
3. **Criar aplicação** → tipo *Loja/Site* → nome “Lume”.
4. **Pegar o Access Token**: dentro da aplicação → aba **Credenciais**
   - O de **produção** começa com `APP_USR-…` ← é esse que você quer.
   - O de teste começa com `TEST-…` (serve só para sandbox).
   - ⚠️ Não confunda com a **Public Key** (ela é para o navegador, o backend não usa).
5. **Gerar o segredo do webhook**:
   - Na aplicação → **Webhooks** → **Configurar notificação**
   - URL de notificação: `https://SEU-BACKEND/api/pagamentos/webhook`
     (para testar no seu PC primeiro, use o ngrok do [item 5](#5--ngrok--testar-o-webhook-do-mp-no-seu-computador-))
   - Clique em **Gerar segredo** e copie o valor → é o `MP_WEBHOOK_SECRET`.
6. **Cole no `backend/.env`** (e depois nas variáveis de ambiente da hospedagem):
   ```env
   MP_ACCESS_TOKEN=APP_USR-...
   MP_WEBHOOK_SECRET=...
   ```

**Como conferir:** reinicie o backend e faça um checkout → abre a tela de pagamento real do Mercado Pago. Depois que o webhook estiver no ar, o pedido muda para “pago” **sozinho** (e baixa o estoque).

- Cartões de teste (não cobram): https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/your-integrations/test/cards
- Pagina de teste do webhook: painel → Webhooks → botão **Testar** → resposta deve ser `200/204`.

---

## 2. 📧 E-mail de verificação (SMTP) 🔴

**O que é:** sem SMTP, o código de verificação de conta **só aparece no log do servidor** (aquele `/tmp/opencode/lume-backend.log`) e ninguém consegue se cadastrar de verdade.

### Opção A — Gmail (grátis, mais rápido)

1. Abra https://myaccount.google.com/security
2. Ative **Verificação em 2 etapas** (obrigatório para gerar senha de app).
3. Gere a **senha de app**: https://myaccount.google.com/apppasswords
   - Se a página não existir, a conta pode estar só com *passkey* — em *Segurança → Senhas de app* (ou ative a verificação em 2 etapas por SMS primeiro).
4. Cole no `backend/.env`:
   ```env
   EMAIL_SMTP_USER=seuemail@gmail.com
   EMAIL_SMTP_PASS=abcdefghijklmnop   #16 dígitos da senha de app (sem espaços)
   EMAIL_REMETENTE=Lume <nao-responda=seuemail@gmail.com>
   ```

### Opção B — provedor profissional (se o Gmail bloquear envio)

| Provedor | Onde pegar | Valores |
|---|---|---|
| **Brevo** (~300 e-mails/dia grátis) | https://www.brevo.com → SMTP & API → gerar **chave SMTP** | `EMAIL_SMTP_HOST=smtp-relay.brevo.com`, `EMAIL_SMTP_PORT=587`, usuário = seu login, senha = chave |
| **Resend** (100 e-mails/dia grátis) | https://resend.com → API Keys | `EMAIL_SMTP_HOST=smtp.resend.com`, `EMAIL_SMTP_PORT=465`, usuário `resend`, senha = API key |

> A porta padrão do projeto é `465` (SSL). Se usar `587`, mude `EMAIL_SMTP_PORT=587` no `.env`.

**Como conferir:** reinicie o backend, tente criar uma conta com um e-mail novo → o aviso *“SMTP não configurado — e-mail NÃO enviado”* **some do log** e a mensagem chega na caixa de entrada (confira o spam na primeira vez).

---

## 3. ☁ Hospedar o backend + banco gerenciado 🔴

**Por quê:** o site publicado chama `localhost:4000` (a sua máquina) e sem servidor no ar cai no catálogo mock. Aqui moram as variáveis de produção.

1. **Banco gerenciado** (pega as credenciais):
   - **Neon** (grátis): https://neon.tech → *Create project* → copie **host, usuário, senha e nome do banco**.
   - ou **Supabase** (grátis): https://supabase.com → projeto → *Connect* → *Session pooler*.
2. **Servidor**: https://render.com (ou https://railway.app) → **New → Web Service** → conecte o repositório `Matheus2henrique/Lume`:
   - **Root Directory**: `backend` (é onde está o Dockerfile — o build já roda o `migrate` na subida).
3. **Environment** (painel da service) — cole tudo:
   ```env
   NODE_ENV=production
   TRUST_PROXY=true
   JWT_SECRET=<gerar UM NOVO, ver comando abaixo>
   CLIENTE_ORIGEM=https://matheus2henrique.github.io
   BACKEND_URL=https://SEU-BACKEND.onrender.com
   DB_HOST=ep-xxx.aws.neon.tech
   DB_PORT=5432
   DB_USER=...
   DB_PASSWORD=...
   DB_NAME=...
   MP_ACCESS_TOKEN=APP_USR-...
   MP_WEBHOOK_SECRET=...
   EMAIL_SMTP_USER=...
   EMAIL_SMTP_PASS=...
   EMAIL_REMETENTE=Lume <nao-responda=...>
   ```
   Gerar o `JWT_SECRET` da produção (na sua máquina):
   ```console
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
   > ⚠️ Com `NODE_ENV=production` o servidor **recusa iniciar** se o `JWT_SECRET` for fraco/placeholder, se `CLIENTE_ORIGEM` tiver `localhost` ou se `DB_PASSWORD` for `postgres`. É proposital — a mensagem de erro no log diz exatamente o que falta.
4. **Seed da loja** (uma vez): no console do provedor → `npm run seed` (produtos/gêneros) e `npm run seed:admin` (admin).
5. ⚠️ **Pendência minha**: bancos como Neon/Supabase exigem **SSL** na conexão e o `db.js` ainda não liga o SSL do pool — **me avise quando tiver o banco** que eu ajusto.

**Como conferir:** abrir `https://SEU-BACKEND/api/health` → `{"ok":true,...,"banco":"ok"}`.

---

## 4. 🌐 GitHub Pages + variável da API 🔴

**Por quê:** sem `VITE_API_URL` o site publicado usa o catálogo mock (e você continua “conseguiando finalizar sem logar” só por isso — o código já bloqueia).

1. Dê o **push** do código (ou me peça para commitar).
2. No repositório: **Settings → Pages** → *Build and deployment → Source* = **GitHub Actions**.
3. **Settings → Secrets and variables → Actions** → aba **Variables** → **New repository variable**:
   - **Nome:** `VITE_API_URL`
   - **Valor:** `https://SEU-BACKEND/api` ← ⚠️ o `/api` no final é obrigatório
4. Cada `push` no `main` publica sozinho (acompanhe na aba **Actions**).

**Como conferir:** abra o site → DevTools → aba *Network* → as chamadas vão para `https://…/api/produtos` (não `localhost`) e a lista de produtos carrega da API.

> Enquanto a API não estiver hospedada, **não defina** a variável — o site segue no mock sem quebrar.

---

## 5. 🧪 ngrok — testar o webhook do MP no seu computador 🔴

O Mercado Pago só consegue te notificar se a sua API estiver **na internet**. O ngrok expõe o seu `localhost` temporariamente.

1. Conta grátis: https://ngrok.com → copie o token em https://dashboard.ngrok.com/get-started/your-authtoken
2. Instale e configure (uma vez só):
   ```console
   ngrok config add-authtoken SEU_TOKEN
   ```
3. Com o backend rodando (`node src/server.js`):
   ```console
   ngrok http 4000
   ```
4. Copie a URL gerada (ex.: `https://abc123.ngrok-free.app`) e no painel do MP use:
   `https://abc123.ngrok-free.app/api/pagamentos/webhook`
5. **Conferir:** painel MP → Webhooks → **Testar** → resposta `200/204` e o log do backend mostra o webhook recebido.

> A URL muda a cada reinício do ngrok no plano grátis — atualize no painel do MP quando mudar.

---

## 6. 🔑 Login com Google 🟠

**Status:** o botão **já existe** no frontend (`Perfil.jsx`), mas está com placeholder e mostra *“Login com Google ainda requer integração no backend”* — **o backend falta** (me avise que eu implemento). A parte que é **sua** é o Client ID:

1. **Google Cloud**: https://console.cloud.google.com → barra superior → **Novo projeto** → nome “Lume”.
2. Menu **APIs e serviços → Tela de consentimento OAuth**:
   - Usuário **externo**, app em modo **Teste**, preencha nome, e-mail e domínio (`https://matheus2henrique.github.io`).
   - **Escopos autorizados**: adicione `email` e `profile`.
   - **Usuários de teste**: adicione o **seu e-mail Google** (enquanto o app estiver em Teste, só quem estiver na lista consegue logar).
3. **APIs e serviços → Credenciais → Criar credenciais → ID de cliente OAuth → Aplicativo Web**:
   - Nome da aplicação: Lume
   - **Origens JavaScript autorizadas** (neste fluxo de janela pop-up **não** precisa de Redirect URI):
     - `http://localhost:5173`
     - `https://matheus2henrique.github.io`
4. Copie o **ID do cliente**: `123456789.apps.googleusercontent.com`

**Onde colar (hoje):** `frontend/src/components/pages/Perfil.jsx`, na linha do `'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com'`.
*(Melhor: migrar para a variável `VITE_GOOGLE_CLIENT_ID` — faço isso junto com a integração do backend, se você pedir.)*

**Como conferir:** o botão abre a janela do Google. A mensagem “ainda requer integração no backend” só desaparece quando eu fechar o fluxo (trocar o token do Google por uma sessão JWT aqui no Lume).

**Depois que estiver tudo certo:** no painel do consentimento → **Publicar app** (com escopos básicos `email/profile` a Google costuma dispensar revisão; mesmo assim pode levar alguns dias).

---

## 7. 🔐 Senha do administrador da loja 🟠

Antes de rodar o seed, defina no `backend/.env`:

```env
ADMIN_EMAIL=seuemail@dominio.com
ADMIN_NOME=Seu Nome
ADMIN_SENHA=uma-senha-forte-que-voce-escolheu
```

```console
cd backend
npm run seed:admin
```

- **Sem `ADMIN_SENHA`**, o seed gera uma senha forte e **imprime só uma vez** no terminal — anote.
- Já criado e quer trocar a senha? Rode o `seed:admin` de novo com o `ADMIN_SENHA` novo (atualiza o mesmo e-mail).
- “Esqueci minha senha” **não existe ainda** (item de código — me avise se quiser).

---

## 8. 🛡 Segurança da conta do GitHub 🟠

1. **2FA**: https://github.com/settings/password → *Enable two-factor authentication* (app tipo Google Authenticator/1Password).
2. **Dependabot**: no repositório → **Settings → Code security and analysis** → ativar *Dependabot alerts* e *Dependabot security updates*.
   - Para atualizações de versão automático também, me avise que eu crio o `.github/dependabot.yml` (5 linhas).
3. **Confirmar e-mail da conta** e revisar **Tokens pessoais** em https://github.com/settings/tokens (apague os que não reconhecer).

---

## 9. 💾 Backup do banco 🟠

**No seu PC (banco em Docker):**

Crie `backend/backup-lume.bat`:

```bat
@echo off
docker exec lume-db pg_dump -U postgres -d Lume -f /tmp/lume.sql
docker cp lume-db:/tmp/lume.sql C:\lume-backups\lume-%DATE:~6,4%-%DATE:~3,2%-%DATE:~0,2%.sql
```

- Crie a pasta `C:\lume-backups` e agende no **Agendador de Tarefas do Windows** (diário, ao iniciar sessão).
- **Backup que não foi testado não existe** — teste o restore:
  ```console
  docker exec -i lume-db psql -U postgres -d Lume < C:\lume-backups\lume-2026-09-23.sql
  ```

**Em produção:** confirme/ative o backup automático do provedor que escolher (Neon e Supabase têm backup diário/PITR nos planos pagos; veja o limite do plano gratuito).

---

## 10. 🌍 Domínio próprio 🟡

1. Compre: https://registro.br (.com.br ~R$ 40/ano) ou Cloudflare/Namecheap.
2. Aponte para o servidor: no Render → **Settings → Custom Domains** (eles te dizem o registro `CNAME`/`ALIAS` para colocar no provedor do domínio).
3. Depois de trocar o domínio, atualize **nos três lugares**:
   - `CLIENTE_ORIGEM=https://seudominio.com` (variáveis da hospedagem)
   - `VITE_API_URL` no GitHub Actions (item 4)
   - Origens autorizadas do Google Cloud (item 6)

---

## 11. 📊 Monitoramento de erros (Sentry) 🟡

1. Conta grátis: https://sentry.io → *Create project* → **Node.js** (backend) e **React** (frontend).
2. Copie o **DSN** do projeto.
3. Me envie o DSN que eu plugo no backend/frontend (é o item “Sentry recebendo erros” do checklist).

---

## ✅ Ordem recomendada

1. [ ] **Mercado Pago**: Access Token + segredo do webhook ([item 1](#1--mercado-pago--receber-dinheiro-de-verdade-))
2. [ ] **Gmail**: verificação em 2 etapas → senha de app → SMTP ([item 2](#2--e-mail-de-verificação-smtp-))
3. [ ] **ngrok** + webhook de teste no MP ([item 5](#5--ngrok--testar-o-webhook-do-mp-no-seu-computador-))
4. [ ] **Hospedar backend + banco** → me avisar para ligar o SSL ([item 3](#3--hospedar-o-backend--banco-gerenciado-))
5. [ ] **GitHub**: Pages = “GitHub Actions” + variável `VITE_API_URL` ([item 4](#4--github-pages--variável-da-api-))
6. [ ] **Senha do admin** no `.env` + `seed:admin` ([item 7](#7--senha-do-administrador-da-loja-))
7. [ ] **2FA + Dependabot** ([item 8](#8--segurança-da-conta-do-github-)) e **backup testado** ([item 9](#9--backup-do-banco-))
8. [ ] **Client ID do Google** ([item 6](#6--login-com-google-)) — quando quiser que eu feche o login
9. [ ] **Domínio** e **Sentry** (opcionais, itens 10 e 11)

> **Travou em algum passo?** Manda um print do painel que eu te guio. E lembra: tudo que é **código** (SSL do banco, login com Google de verdade, esqueci minha senha, Sentry) é comigo — é só pedir.

---

## 📋 Resumo de todos os itens

| # | Item | Prioridade |
|---|---|---|
| 🗺️ | Mapa rápido: credencial → arquivo/painel onde vai colar | — |
| 1 | Mercado Pago — criar aplicação, `APP_USR-` Access Token, segredo do webhook, cartões de teste | 🔴 |
| 2 | SMTP — Gmail (2 etapas → senha de app) ou Brevo/Resend com os valores prontos do `.env` | 🔴 |
| 3 | Hospedar backend + banco — Render + Neon/Supabase, lista completa das variáveis de produção (inclui o `JWT_SECRET` novo e a trava que bloqueia produção mal configurada) | 🔴 |
| 4 | GitHub Pages — Pages = "GitHub Actions" + variável `VITE_API_URL` (com `/api` no fim — explicado por que) | 🔴 |
| 5 | ngrok — expor o `localhost` para testar o webhook do MP | 🔴 |
| 6 | Login com Google — Google Cloud passo a passo (projeto → tela de consentimento → origens `localhost:5173` + Pages → Client ID) + onde colar no `Perfil.jsx` e o que falta de backend | 🟠 |
| 7 | Senha do admin — `ADMIN_SENHA` no `.env` + `npm run seed:admin` | 🟠 |
| 8 | Conta GitHub — 2FA + Dependabot | 🟠 |
| 9 | Backup — script `.bat` para o Agendador de Tarefas + como testar o restore | 🟠 |
| 10 | Domínio — Registro.br + os 3 lugares que mudam depois | 🟡 |
| 11 | Sentry — conta + DSN (me mandar que eu plugo) | 🟡 |
