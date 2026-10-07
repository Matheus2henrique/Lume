# 🔑 Todos os tokens e credenciais do projeto (produção)

> Guia completo de **toda credencial/token** que o Lume usa ou vai usar,
> **o que cada um faz**, **onde conseguir** (link) e **onde colar**.
>
> Hospedagem prevista: **Hostinger** (front + back + banco).
>
> **Legenda:** 🔴 bloqueia vender · 🟠 importante · 🟡 opcional

---

## 🗺️ Mapa rápido: credencial → onde colar

| Credencial | Onde vai |
|---|---|
| `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` | painel da Hostinger (env do backend) **ou** `backend/.env` |
| `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASS`, `EMAIL_REMETENTE` | idem |
| `JWT_SECRET` (novo, forte) | idem |
| `ME_TOKEN`, `ME_CEP_ORIGEM`, `ME_AMBIENTE`, `ME_SERVICOS`, `ME_CONTATO` | idem |
| Credenciais do banco (`DB_*`) | idem |
| `CLIENTE_ORIGEM`, `BACKEND_URL`, `NODE_ENV=production`, `TRUST_PROXY=true` | idem (criadas por você) |
| `ADMIN_EMAIL`, `ADMIN_SENHA`, `ADMIN_NOME` | idem (antes do `npm run seed:admin`) |
| `VITE_API_URL` | GitHub → Settings → Secrets and variables → **Actions → Variables** |
| `GOOGLE_CLIENT_ID` | `frontend/src/components/pages/Perfil.jsx` (ou `VITE_GOOGLE_CLIENT_ID` quando eu migrar) |
| Sentry `DSN` | me mandar que eu plugo |

> Regra de ouro: **nenhum token vai para o frontend** (exceto `GOOGLE_CLIENT_ID` e `VITE_API_URL`).
> Toda chamada sensível passa pelo backend. O `.gitignore` já bloqueia o `.env`.

---

## 🔴 Obrigatórios (sem isso a loja não vende)

### 1. `MP_ACCESS_TOKEN` — receber dinheiro de verdade 💳

- **O que faz:** identifica a sua conta do Mercado Pago nas chamadas do backend.
  Com ele o checkout cria uma **preferência de pagamento real** → o cliente
  paga com cartão/Pix na página do Mercado Pago e o dinheiro cai na sua conta.
  **Sem ele o pedido fica `simulado` e nenhum centavo é cobrado.**
- **Formato:** produção começa com `APP_USR-…` · teste com `TEST-…` (sandbox).
  ⚠️ Não confunda com a **Public Key** (a do backend não usa).
- **Onde conseguir:**
  1. Crie a conta: https://www.mercadopago.com.br/registro (CPF ou CNPJ;
     para cobrar de verdade a conta precisa estar **verificada** — comprovante)
  2. Painel de desenvolvedores: https://www.mercadopago.com.br/developers/panel/app
  3. **Criar aplicação** → tipo *Loja/Site* → nome "Lume"
  4. Dentro da aplicação → aba **Credenciais** → copie o Access Token
- **Onde colar:** `MP_ACCESS_TOKEN=APP_USR-…` no env do backend

### 2. `MP_WEBHOOK_SECRET` — confirmar o pagamento sozinho 🔔

- **O que faz:** segredo que valida a **assinatura** das notificações (webhooks)
  que o Mercado Pago envia ao backend quando o cliente paga. É ele que faz o
  pedido mudar de `pendente` → `pago` **automaticamente** e baixar o estoque.
  Sem esse segredo o servidor **recusa subir em produção** (`env.js:78`)
  e o pagamento nunca seria confirmado com segurança.
- **Onde conseguir:** mesmo painel do item 1 → aplicação "Lume" → **Webhooks**
  → **Configurar notificação** → URL: `https://SEU-DOMINIO/api/pagamentos/webhook`
  → **Gerar segredo** → copiar
- **Onde colar:** `MP_WEBHOOK_SECRET=…` no env do backend
- **Testando no seu PC:** o Mercado Pago não alcança `localhost` — use o
  ngrok (item 11) ou espere o backend estar no ar na Hostinger.

### 3. `EMAIL_SMTP_USER` / `EMAIL_SMTP_PASS` — verificação de conta ✉️

- **O que faz:** envia o **código de verificação de e-mail** no cadastro e os
  **e-mails de recuperação de senha**. Sem SMTP ninguém consegue criar conta
  (o código só aparece no log do servidor) e o "esqueci a senha" fica morto.
  Também serve de remetente dos e-mails transacionais da loja.
- **Onde conseguir (Gmail — grátis):**
  1. Ative **Verificação em 2 etapas**: https://myaccount.google.com/security
  2. Gere a **senha de app**: https://myaccount.google.com/apppasswords
     (16 dígitos, sem espaços)
- **Alternativas se o Gmail bloquear:**
  - **Brevo** (~300 e-mails/dia grátis): https://www.brevo.com → SMTP & API →
    chave SMTP → `EMAIL_SMTP_HOST=smtp-relay.brevo.com`, `EMAIL_SMTP_PORT=587`
  - **Resend** (100/dia grátis): https://resend.com → API Keys
- **Onde colar:** `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASS`, `EMAIL_REMETENTE`

### 4. `JWT_SECRET` — segredo dos logins 🔐

- **O que faz:** assina os **tokens de sessão (JWT)** de quem loga. Se for fraco
  ou igual ao de produção, qualquer pessoa forja uma sessão de admin.
  Em produção o servidor **recusa subir** se o segredo tiver < 32 caracteres
  ou for placeholder (`env.js:64`).
- **Onde conseguir:** gere **um novo por ambiente** no seu PC:
  ```console
  node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
  ```
  > O local (dev) já tem um — gere outro para a Hostinger. Nunca reutilize.

### 5. Credenciais do banco `DB_HOST/PORT/USER/PASSWORD/NAME` 🗄️

- **O que faz:** conexão do backend com o **PostgreSQL** (produtos, pedidos,
  clientes, estoque). Em produção o servidor recusa senha padrão `"postgres"`.
- **Onde conseguir:**
  - **Neon** (grátis, recomendado): https://neon.tech → *Create project* →
    copiar host/usuário/senha/nome → usar com `DB_SSL=true`
  - **Supabase** (grátis): https://supabase.com → projeto → *Connect* →
    *Session pooler*
  - **No VPS Hostinger:** instale o PostgreSQL manualmente
    (os planos de hospedagem compartilhada da Hostinger **não** rodam
    Node.js + Postgres — para "front+back+banco" juntos o caminho é o **VPS**)
- **Onde colar:** `DB_*` + `DB_SSL=true` no env do backend

### 6. `VITE_API_URL` — apontar o site para a API 🌐

- **O que faz:** diz ao **frontend publicado** qual é a URL do backend.
  Sem ela o site publicado continua no **catálogo mock** (produtos falsos,
  checkout "fingindo" funcionar). Não é segredo — é só uma URL — mas é
  obrigatória e vai no GitHub, não no `.env`.
- **Onde conseguir:** valor = `https://SEU-DOMINIO/api` (o `/api` no fim é
  obrigatório). Colar em: GitHub → repositório → **Settings → Secrets and
  variables → Actions** → aba **Variables** → **New repository variable**
- **Link:** https://github.com/settings/actions

### 7. Variáveis de ambiente da hospedagem ⚙️

- **O que faz:** configuram o backend **no ambiente** da Hostinger (igual ao
  `.env` local, mas no painel):
  - `NODE_ENV=production` — liga as travas de segurança
  - `TRUST_PROXY=true` — para o rate limit enxergar o IP real atrás do proxy
  - `BACKEND_URL=https://SEU-DOMINIO` — URL pública (webhook do MP precisa)
  - `CLIENTE_ORIGEM=https://SEU-DOMINIO` (ou o domínio do front)
- **Onde colar:** painel da Hostinger → variáveis de ambiente do app
  (ou `.env` no VPS)

---

## 🟠 Importantes

### 8. `ME_TOKEN` + `ME_CEP_ORIGEM` + `ME_AMBIENTE` + `ME_CONTATO` — cálculo de frete 📦

- **O que faz:** ligam o **cálculo de frete** (Melhor Envio). Com eles o
  cliente digita o CEP e vê opções reais (PAC, SEDEX, Jadlog…) com preço e
  prazo; o valor entra no total do pedido e é cobrado junto.
  **Sem `ME_TOKEN` o frete fica desativado** (o site funciona, só sem frete).
  A **fase 2** (comprar etiqueta e rastreio automático) **não** está
  implementada — hoje a dona leva a encomenda aos Correios manualmente.
- **Onde conseguir:**
  1. Conta grátis: https://melhorenvio.com.br
  2. Painel → **API/Aplicações** → fluxo de autorização → permissão
     mínima `shipping-calculate`
  3. Perfil → **Endereços** → cadastrar o endereço da loja e anotar o
     **CEP de origem** (só dígitos)
- **Valores:**
  ```env
  ME_TOKEN=…
  ME_CEP_ORIGEM=00000000
  ME_AMBIENTE=production      # sandbox | production
  ME_CONTATO=seu@email.com    # exigência da API (header User-Agent)
  ME_SERVICOS=                # vazio = todas as transportadoras
  ```
- **Observação:** cotar é **grátis**; saldo na carteira só será preciso na
  fase 2 (comprar etiqueta).

### 9. `ADMIN_EMAIL` / `ADMIN_SENHA` / `ADMIN_NOME` — conta da dona 👑

- **O que faz:** cria/atualiza a conta de **administradora** (painel de pedidos,
  produtos e estoque). Sem `ADMIN_SENHA` o seed gera uma senha forte e imprime
  **só uma vez** no terminal.
- **Onde conseguir:** você mesmo define no env **antes** de rodar:
  ```console
  cd backend
  npm run seed:admin
  ```

### 10. `GOOGLE_CLIENT_ID` — botão "Entrar com Google" 🔵

- **O que faz:** autentica o cliente pela conta Google.
  **Status:** o botão existe no frontend mas está com placeholder — **o backend
  ainda não implementa o fluxo** (me avise que eu fecho).
- **Onde conseguir:**
  1. https://console.cloud.google.com → **Novo projeto** → "Lume"
  2. *APIs e serviços → Tela de consentimento OAuth* → usuário externo,
     escopos `email` e `profile`, adicione seu e-mail em *Usuários de teste*
  3. *APIs e serviços → Credenciais → Criar credenciais → ID de cliente OAuth*
     → Aplicativo Web → origens: `http://localhost:5173` e seu domínio
- **Onde colar:** `frontend/src/components/pages/Perfil.jsx` (placeholder)

### 11. ngrok — testar o webhook do MP localmente 🧪

- **O que faz:** expõe o seu `localhost` com uma URL pública temporária para o
  Mercado Pago conseguir notificar o pagamento durante o desenvolvimento.
  **Em produção não precisa** (o backend estará no ar na Hostinger).
- **Onde conseguir:** conta grátis em https://ngrok.com → token em
  https://dashboard.ngrok.com/get-started/your-authtoken
- **Uso:**
  ```console
  ngrok config add-authtoken SEU_TOKEN
  ngrok http 4000
  ```
  Depois use a URL gerada como webhook no painel do MP.

---

## 🟡 Opcionais

### 12. Domínio próprio 🌍

- **O que faz:** deixa `https://lumeloja.com.br` no lugar de
  `https://seudominio.hostinger.com`. Depois de trocar, atualize **3 lugares**:
  `CLIENTE_ORIGEM`, `BACKEND_URL` (env), `VITE_API_URL` (GitHub) e as origens
  do Google Cloud.
- **Onde conseguir:** na própria Hostinger, https://registro.br ou
  https://www.cloudflare.com

### 13. Sentry `DSN` — monitoramento de erros 📊

- **O que faz:** recebe alertas quando algo quebrar em produção (erro de
  backend/frontend com stack trace), em vez de descobrir pelo cliente.
- **Onde conseguir:** https://sentry.io → *Create project* → Node.js + React →
  copiar o **DSN** → me mandar que eu plugo

### 14. Segurança da conta GitHub 🛡️

- **O que faz:** protege o repositório (código-fonte).
- **Onde fazer:** 2FA em https://github.com/settings/password · Dependabot em
  *Settings → Code security and analysis* · revise tokens em
  https://github.com/settings/tokens

---

## ✅ Checklist de produção na Hostinger

- [ ] **Mercado Pago**: `APP_USR-` Access Token + `MP_WEBHOOK_SECRET` (itens 1-2)
- [ ] **SMTP**: senha de app do Gmail ou chave Brevo (item 3)
- [ ] **JWT_SECRET** novo gerado (item 4)
- [ ] **Banco**: Neon/VPS Postgres + `DB_*` + `DB_SSL=true` (item 5)
- [ ] **Hospedar backend** na Hostinger → `NODE_ENV=production`, `TRUST_PROXY=true`,
      `BACKEND_URL`, `CLIENTE_ORIGEM` (item 7)
- [ ] **Seed**: `npm run seed` + `npm run seed:admin` com `ADMIN_*` (item 9)
- [ ] **GitHub Pages**: Pages = GitHub Actions + `VITE_API_URL` (item 6)
- [ ] **Frete** (se quiser): `ME_TOKEN` + `ME_CEP_ORIGEM` + `ME_CONTATO` (item 8)
- [ ] Opcionais: domínio (12), Sentry (13), Google (10), 2FA GitHub (14)

> **Travas de segurança:** com `NODE_ENV=production` o backend **recusa iniciar**
> se faltar `JWT_SECRET` forte, `MP_WEBHOOK_SECRET` (com MP ligado),
> `BACKEND_URL` público (com MP ligado) ou `ME_CEP_ORIGEM` (com frete ligado) —
> a mensagem no log diz exatamente o que falta (`env.js:61-103`).
>
> Passo a passo detalhado de cada item: [CONFIGURACOES_EXTERNAS.md](./CONFIGURACOES_EXTERNAS.md)
> · Frete: [MELHOR_ENVIO.md](./MELHOR_ENVIO.md) · Sair do pagamento simulado: [SAIR_DO_SIMULADO.md](./SAIR_DO_SIMULADO.md)
