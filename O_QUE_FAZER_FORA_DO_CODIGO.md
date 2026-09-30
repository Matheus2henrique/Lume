# ✅ O que você precisa fazer FORA do código

> Aqui não tem programação: são **contas, painéis, cliques e credenciais**.
> Está em ordem de prioridade. Cada item traz: **por quê → passo a passo → como conferir → tempo**.
>
> Detalhes extras e links: **[CONFIGURACOES_EXTERNAS.md](./CONFIGURACOES_EXTERNAS.md)** · Situação do projeto: **[PLANO_PRODUCAO.md](./PLANO_PRODUCAO.md)**
>
> **Legenda:** 🔴 bloqueia vender · 🟠 importante · 🟡 opcional

---

## ⚠️ 0. FAÇA ISSO ANTES DE QUALQUER COISA — revogar credencial exposta 🔴

**Por quê:** uma senha de app do Gmail ficou commitada no repositório (commit `03254fa`). Ela saiu do código atual, mas **continua no histórico do git** — e quem tiver o repositório pode usar. Remover do arquivo **não** basta: é preciso **revogar a senha no Google**.

**Passo a passo (2 minutos):**

1. Ative **Verificação em 2 etapas** se ainda não tiver: https://myaccount.google.com/security
2. Abra https://myaccount.google.com/apppasswords
   - Se a página não aparecer: *Segurança → Verificação em 2 etapas → Senhas de app*.
3. Na lista, procure a senha de app antiga (provavelmente com nome parecido com “Lume” ou a que você gerou em setembro) → clique nos **⋮** → **Remover**.
   - Não achou? Remove **todas** que você não reconhecer — é melhor exagerar.
4. Clique em **Criar senha** → nomeie `Lume backend` → **Copiar** (os 16 dígitos, sem espaços).
5. Abra `backend/.env` e troque:
   ```env
   EMAIL_SMTP_PASS=os-16-digitos-da-nova-senha
   ```
6. Reinicie o backend (`npm run dev`) — se o e-mail ainda não estiver configurado, o SMTP é o próximo item.

**Como conferir:** crie uma conta com um e-mail novo → o código de verificação **chega no e-mail** (confira o spam na primeira vez).

**Tempo:** 2 minutos · **Custo:** grátis

---

## 🔴 1. Mercado Pago — receber dinheiro de verdade

**Por quê:** hoje o pagamento é **simulado** (nenhum valor é cobrado). Sem Access Token e sem segredo do webhook, a loja não vende.

**Passo a passo:**

1. Conta: https://www.mercadopago.com.br/registro (CPF/CNPJ; para valores reais a conta precisa estar **verificada**).
2. Painel de desenvolvedores: https://www.mercadopago.com.br/developers/panel/app → **Criar aplicação** → tipo *Loja/Site* → nome “Lume”.
3. Dentro da aplicação → aba **Credenciais** → copie o Access Token de **produção** (começa com `APP_USR-…`; o `TEST-…` é só sandbox; a *Public Key* o backend não usa).
4. Na mesma aplicação → **Webhooks** → **Configurar notificação**:
   - URL: `https://SEU-BACKEND/api/pagamentos/webhook` (ou `https://abc123.ngrok-free.app/api/pagamentos/webhook` para testar no seu PC — item 5)
   - **Gerar segredo** → copie → é o `MP_WEBHOOK_SECRET`.
5. Cole no `backend/.env` **e** nas variáveis da hospedagem (item 3):
   ```env
   MP_ACCESS_TOKEN=APP_USR-...
   MP_WEBHOOK_SECRET=...
   ```

**Como conferir:**
- Reinicie o backend e faça um checkout → abre a tela de pagamento **real** do MP.
- Painel do MP → Webhooks → **Testar** → resposta `200/204` e o pedido muda para “pago” sozinho (baixa o estoque).
- Sem o segredo em produção, o servidor **não sobe** (trava proposital) e webhook sem assinatura recebe `401`.

**Tempo:** 30 minutos · Cartões de teste (não cobram): https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/your-integrations/test/cards

---

## 🔴 2. E-mail de verificação (SMTP)

**Por quê:** sem SMTP o código de verificação só aparece no log do servidor — ninguém consegue se cadastrar.

**Opção A — Gmail (grátis):**

1. Verificação em 2 etapas: https://myaccount.google.com/security
2. Gere a senha de app: https://myaccount.google.com/apppasswords (use a nova criada no item 0)
3. Cole no `backend/.env`:
   ```env
   EMAIL_SMTP_HOST=smtp.gmail.com
   EMAIL_SMTP_PORT=465
   EMAIL_SMTP_USER=seuemail@gmail.com
   EMAIL_SMTP_PASS=abcdfghijklmnopq          # 16 dígitos, sem espaços
   EMAIL_REMETENTE=Lume <nao-responda=seuemail@gmail.com>
   ```

**Opção B — se o Gmail bloquear o envio:** Brevo (https://www.brevo.com → SMTP & API → chave SMTP) ou Resend (https://resend.com → API Keys). Veja os valores prontos em [CONFIGURACOES_EXTERNAS.md, item 2](./CONFIGURACOES_EXTERNAS.md#2--e-mail-de-verificação-smtp-).

**Como conferir:** reinicie e crie uma conta nova → o aviso “SMTP não configurado” **some do log** e o e-mail chega.

**Tempo:** 15 minutos

---

## 🔴 3. Hospedar o backend + banco gerenciado

**Por quê:** o site publicado chama `localhost:4000` (a sua máquina). Sem servidor no ar, o site cai no catálogo mock.

**Passo a passo:**

1. **Banco gerenciado:** https://neon.tech (grátis) → *Create project* → copie **host, usuário, senha e nome**. (Alternativa: Supabase → projeto → *Connect* → *Session pooler*.)
2. **Servidor:** https://render.com → **New → Web Service** → repositório `Matheus2henrique/Lume` → **Root Directory** = `backend` (o build já roda o `migrate` na subida).
3. **Environment** (painel da service):
   ```env
   NODE_ENV=production
   TRUST_PROXY=true
   JWT_SECRET=<gerar um novo, veja o comando abaixo>
   CLIENTE_ORIGEM=https://matheus2henrique.github.io
   BACKEND_URL=https://SEU-BACKEND.onrender.com
   DB_HOST=ep-xxx.aws.neon.tech
   DB_PORT=5432
   DB_USER=...
   DB_PASSWORD=...
   DB_NAME=...
   DB_SSL=true
   MP_ACCESS_TOKEN=APP_USR-...
   MP_WEBHOOK_SECRET=...
   EMAIL_SMTP_USER=...
   EMAIL_SMTP_PASS=...
   EMAIL_REMETENTE=Lume <nao-responda=...>
   ADMIN_EMAIL=...
   ADMIN_SENHA=...
   ```
   Gere o `JWT_SECRET` novo (não use o local):
   ```console
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
   > O servidor **recusa iniciar** em produção com segredo fraco, `CLIENTE_ORIGEM` com localhost ou senha de banco `postgres`. A mensagem no log diz exatamente o que falta — é proposital.
   > **Neon/Supabase exigem SSL:** `DB_SSL=true` já existe no código (foi implementado nesta rodada).
4. **Seed uma vez** no console do provedor: `npm run seed` e `npm run seed:admin`.

**Como conferir:** abrir `https://SEU-BACKEND/api/health` → `{"ok":true,...,"banco":"ok"}`.

**Tempo:** 1 a 2 horas

---

## 🔴 4. GitHub Pages + variável da API

**Por quê:** sem `VITE_API_URL` o site publicado continua no catálogo mock.

1. Dê **push** do código.
2. Repositório → **Settings → Pages** → *Build and deployment → Source* = **GitHub Actions**.
3. **Settings → Secrets and variables → Actions** → aba **Variables** → **New repository variable**:
   - Nome: `VITE_API_URL`
   - Valor: `https://SEU-BACKEND/api` ← o `/api` no final é **obrigatório**
4. Cada push no `main` publica sozinho (acompanhe na aba **Actions**).

**Como conferir:** site aberto → DevTools → *Network* → as chamadas vão para `https://…/api/produtos` (não `localhost`).

> Enquanto a API não estiver hospedada, **não defina** a variável — o site segue no mock sem quebrar.

**Tempo:** 5 minutos

---

## 🔴 5. ngrok — testar o webhook do MP no seu computador

O Mercado Pago só te notifica se a API estiver **na internet**.

1. Conta grátis: https://ngrok.com → token em https://dashboard.ngrok.com/get-started/your-authtoken
2. Uma vez: `ngrok config add-authtoken SEU_TOKEN`
3. Com o backend rodando: `ngrok http 4000`
4. Copie a URL gerada e no painel do MP use: `https://abc123.ngrok-free.app/api/pagamentos/webhook`
5. **Conferir:** painel MP → Webhooks → **Testar** → `200/204`.

> No plano grátis a URL muda a cada reinício — atualize no painel do MP.

**Tempo:** 15 minutos

---

## 🟠 6. Senha do administrador da loja

1. No `backend/.env`:
   ```env
   ADMIN_EMAIL=seuemail@dominio.com
   ADMIN_NOME=Seu Nome
   ADMIN_SENHA=uma-senha-forte-que-voce-escolheu
   ```
2. Rode:
   ```console
   cd backend
   npm run seed:admin
   ```
- Sem `ADMIN_SENHA`, o seed gera uma senha forte e **imprime só uma vez** — anote.
- Trocar depois? Rode de novo com o `ADMIN_SENHA` novo.
- Esqueceu a senha? O fluxo **“Esqueci minha senha”** já existe na tela de login (código por e-mail, 10 min, 5 tentativas).

**Tempo:** 5 minutos

---

## 🟠 7. Agendar o backup do banco (Windows)

**Por quê:** backup que não existe não salva nada. Os scripts já estão prontos e o **restore foi testado** — falta só agendar.

1. Teste manualmente (uma vez):
   ```console
   cd backend
   npm run backup -- --pg-bin "C:\Program Files\PostgreSQL\18\bin"
   ```
   > Se o `pg_dump` estiver no PATH, o `--pg-bin` é opcional. O dump vai para `backend/backups/`.
2. Teste o restore (não apaga nada — cria o banco `lume_restore_teste`, compara tabelas/índices/CHECKs e apaga):
   ```console
   npm run restore:teste -- --pg-bin "C:\Program Files\PostgreSQL\18\bin"
   ```
   Esperado no fim: **RESTORE OK**.
3. Agende no **Agendador de Tarefas do Windows**:
   - `Win + S` → **Agendador de Tarefas** → **Criar Tarefa…** (aba Geral)
   - **Disparadores** → *Novo…* → Diariamente, horário que a máquina estiver ligada (ex.: 03:00)
   - **Ações** → *Novo…*:
     - Programa: `C:\Program Files\nodejs\npm.cmd`
     - Argumentos: `run backup -- --pg-bin "C:\Program Files\PostgreSQL\18\bin"`
     - Iniciar em: `C:\Users\SEU_USUARIO\Documents\...\Site-Impressao3D\backend`
   - Marque **Executar com os maiores privilégios** e, na aba *Condições*, desmarque “Só iniciar se o computador estiver usando energia de linha” se for notebook.
4. **Confira** que o arquivo novo apareceu em `backend/backups/` no dia seguinte.

**Em produção:** ative o backup automático do provedor (Neon/Supabase têm backup diário; veja o limite do plano gratuito).

**Tempo:** 20 minutos

---

## 🟠 8. Segurança da conta do GitHub

1. **2FA**: https://github.com/settings/password → *Enable two-factor authentication* (app tipo Google Authenticator).
2. **Dependabot**: repositório → **Settings → Code security and analysis** → ativar *Dependabot alerts* e *Dependabot security updates*.
   - Quer atualização automática de versão? Me pede que eu crio o `.github/dependabot.yml`.
3. Revise **Tokens pessoais** em https://github.com/settings/tokens (apague os que não reconhecer).

**Tempo:** 10 minutos

---

## 🟡 9. Login com Google (opcional)

O botão já existe no frontend, mas está com placeholder. Sua parte é o **Client ID**:

1. https://console.cloud.google.com → **Novo projeto** → “Lume”.
2. **APIs e serviços → Tela de consentimento OAuth** → usuário externo, modo *Teste*, escopos `email` e `profile`, adicione **seu e-mail** em *Usuários de teste*.
3. **APIs e serviços → Credenciais → Criar credenciais → ID de cliente OAuth → Aplicativo Web**:
   - Origens JavaScript: `http://localhost:5173` e `https://matheus2henrique.github.io`
4. Copie o ID: `123456789.apps.googleusercontent.com`.

**Onde colar hoje:** `frontend/src/components/pages/Perfil.jsx` (linha do placeholder).
**Falta código** para trocar o token do Google por sessão aqui no Lume — me avise que eu fecho.

---

## 🟡 10. Domínio próprio (opcional)

1. Compre em https://registro.br (~R$ 40/ano).
2. No Render → **Settings → Custom Domains** → siga o `CNAME`/`ALIAS` que eles indicarem.
3. Depois troque **nos três lugares**: `CLIENTE_ORIGEM` (hospedagem) · `VITE_API_URL` (GitHub Actions) · origens autorizadas do Google Cloud.

---

## 🟡 11. Monitoramento de erros — Sentry (opcional)

1. https://sentry.io → *Create project* → **Node.js** (backend) e **React** (frontend).
2. Copie o **DSN** e me mande — eu plugo (é o item “Sentry recebendo erros” do checklist).

---

## 🗺️ Ordem recomendada

1. [ ] **0. Revogar a senha de app do Gmail** e gerar a nova (2 min — faça agora)
2. [ ] **1. Mercado Pago** — Access Token + segredo do webhook (30 min)
3. [ ] **2. SMTP** — colar a nova senha de app (15 min)
4. [ ] **3. Hospedar backend + banco** — com `DB_SSL=true` (1–2 h)
5. [ ] **4. GitHub Pages** — Pages = “GitHub Actions” + `VITE_API_URL` (5 min)
6. [ ] **5. ngrok** — testar o webhook de verdade (15 min)
7. [ ] **6. Senha do admin** no `.env` + `seed:admin` (5 min)
8. [ ] **7. Backup agendado** no Agendador de Tarefas + restore testado (20 min)
9. [ ] **8. 2FA + Dependabot** no GitHub (10 min)
10. [ ] **9. Client ID do Google** — quando quiser o login com Google
11. [ ] **10. Domínio** e **11. Sentry** — se/quando quiser

---

## 🧰 O que é comigo (código) — é só pedir

- Integração do **login com Google** no backend (trocar o token do Google por sessão JWT)
- **Sentry** plugado no backend e no frontend (me mande o DSN)
- **Reserva de estoque + expiração** de pedido pendente (item 1.6 do plano)
- **E-mails transacionais** de confirmação de pedido (item 1.2)
- **Upload de imagem em S3/R2** em vez de base64 (itens 1.3/1.4)
- Paginação/busca em `/api/produtos`, imagens em CDN, fila de webhooks

> **Travou em algum passo?** Manda um print do painel que eu te guio.
