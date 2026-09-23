# Lume — Loja de Impressão 3D (MVP)

[![CI](https://github.com/Matheus2henrique/Lume/actions/workflows/ci.yml/badge.svg)](https://github.com/Matheus2henrique/Lume/actions/workflows/ci.yml)

**Loja virtual (MVP) de peças impressas em 3D sob demanda.** Catálogo por universos (Romance, Fantasia e Suspense), página de detalhes do produto, carrinho, checkout com pagamento (simulado ou Mercado Pago), verificação de e-mail no cadastro, favoritos, área de perfil e painel administrativo.

> Projeto em evolução — MVP funcional para validar a venda de modelos 3D personalizados sob demanda. O roteiro completo (com prioridades e esforço) está no **[PLANO_PRODUCAO.md](./PLANO_PRODUCAO.md)**.

---

## Índice

- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Como rodar o projeto](#-como-rodar-o-projeto)
- [Pagamento real com Mercado Pago](#-pagamento-real-com-mercado-pago)
- [Endpoints da API](#-endpoints-da-api)
- [Testes](#-testes)
- [Deploy (GitHub Pages)](#-deploy-github-pages)
- [Scripts](#-scripts)
- [Normas e boas práticas](#-normas-e-boas-práticas)
- [Próximos passos](#-próximos-passos)
- [Licença](#-licença)

---

## ✨ Funcionalidades

- 🏷️ **Catálogo por universos** — Romance, Fantasia e Suspense, com filtro e página de detalhes
- 📄 **Página de detalhes** — preço, estoque, descrição, personalização com upload de arquivo e "Comprar agora"
- 🛒 **Carrinho e checkout** — dados de entrega + pagamento (Pix ou cartão), **somente com conta logada** (sem login não é possível finalizar)
- ✉️ **Verificação de e-mail** — código de 6 dígitos no cadastro (HMAC, 10 min, 5 tentativas); login travado até confirmar; sem SMTP configurado o código sai no console do backend (modo dev)
- 💳 **Mercado Pago** — redirecionamento para o checkout real; o webhook valida a assinatura e só então o pedido vira `pago` e o estoque baixa
- ❤️ **Favoritos** — persistidos no banco quando o usuário está logado
- 👤 **Perfil** — cadastro, login, verificação de e-mail e consulta dos dados (`/api/auth/perfil`)
- 🛡️ **Painel admin** — CRUD de produtos e universos pela API (somente admin)
- 📰 **Newsletter** — assinatura direto no site
- 🔑 **Segurança** — JWT + bcrypt, rate limit nos endpoints sensíveis, cabeçalhos HTTP, `trust proxy` configurável e graceful shutdown — **dados de cartão nunca passam pelo seu servidor**
- 🎨 **Design responsivo** — layout adaptável, rolagem suave e URLs amigáveis

## 🧰 Tecnologias

| Tecnologia | Versão | Finalidade |
|---|---|---|
| [React](https://react.dev) | 19.x | Interface do usuário |
| [Vite](https://vite.dev) | 8.x | Build e dev server |
| [Tailwind CSS](https://tailwindcss.com) | 4.x | Estilização |
| [ESLint](https://eslint.org) | 10.x | Qualidade de código |
| [Express](https://expressjs.com) | 4.x | API do backend |
| [PostgreSQL](https://www.postgresql.org) | 15/16/17 | Banco de dados (driver `pg`) |
| [JWT](https://jwt.io) + bcrypt | — | Autenticação de usuários |
| [Mercado Pago](https://www.mercadopago.com.br/developers) | API v1 | Pagamento (checkout + webhook) |
| [Nodemailer](https://nodemailer.com) | — | Envio do código de verificação por e-mail (SMTP) |
| [Jest](https://jestjs.io) | — | Testes automatizados do backend |
| GitHub Pages | — | Hospedagem do frontend |

## 📁 Estrutura do projeto

```
Lume/
├── frontend/                       # React + Vite → GitHub Pages
│   ├── index.html                  # lang pt-BR + deep link (SPA no GH Pages)
│   ├── public/
│   │   └── 404.html                # fallback de rotas no GH Pages
│   ├── package.json                # scripts dev/build/lint/deploy
│   ├── vite.config.js              # base /Lume/
│   └── src/
│       ├── main.jsx                # Entry point
│       ├── App.jsx                 # Componente raiz e navegação
│       ├── index.css               # Estilos globais (Tailwind)
│       ├── api.js                  # Cliente HTTP (fetch + token + checkoutToken)
│       ├── data/produtos.js        # Catálogo mock (fallback quando a API cai)
│       └── components/
│           ├── layout/             # Header, Footer
│           ├── pages/              # Entrada, Genero, ProdutoDetalhe, Carrinho,
│           │                       # Perfil (login/cadastro/verificação),
│           │                       # Favoritos, Admin
│           └── ui/                 # Card, Icones, Reveal,
│                                   # ProdutoFormModal, NichoFormModal
├── backend/                        # API Express + PostgreSQL
│   ├── .env                        # ← NÃO versionado (copie do .env.example)
│   ├── .env.example                # Modelo (banco, Mercado Pago, e-mail)
│   ├── __tests__/                  # Jest: auth, health, produtos, mercadoPago
│   └── src/
│       ├── server.js               # App, segurança, /api/health, graceful shutdown
│       ├── db.js                   # Pool do PostgreSQL
│       ├── env.js                  # Validação das variáveis de ambiente
│       ├── logger.js               # Log de requisições/erros
│       ├── schema.sql              # Criação das tabelas
│       ├── migrate.js              # Aplica o schema (npm run migrate)
│       ├── seed.js                 # Produtos (npm run seed)
│       ├── seed-generos.js         # Universos (npm run seed)
│       ├── seed-admin.js           # Admin inicial (npm run seed:admin)
│       ├── middleware/
│       │   ├── auth.js             # JWT + checkoutToken (convidado) + admin
│       │   └── rateLimiter.js      # Rate limit (auth, pagamento, e-mail)
│       ├── services/
│       │   ├── mercadoPago.js      # Preferência + assinatura do webhook
│       │   └── email.js            # Código de verificação (SMTP ou modo dev)
│       ├── data/produtos.js        # Dados iniciais dos produtos
│       └── routes/                 # auth, produtos, generos, favoritos,
│                                   # pedidos, pagamentos, newsletter
├── Normas.md                       # Regras, banco e pagamento (passo a passo)
├── PLANO_PRODUCAO.md               # Plano MVP → produção (fases e prioridades)
└── README.md
```

## 🚀 Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org) **20.x ou superior** (recomendado) e npm
- [PostgreSQL](https://www.postgresql.org/download/) instalado e **rodando** (porta padrão `5432`)
- Comandos para **cmd/PowerShell** (Windows)

### 1. Frontend (React + Vite)

```console
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### 2. Backend (Express + PostgreSQL)

**a) Configure o banco** — copie `backend/.env.example` para `backend/.env` e edite:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=SUA_SENHA
DB_NAME=lume
```

> O `.env.example` traz também as chaves do Mercado Pago (`MP_ACCESS_TOKEN`, `BACKEND_URL`, `MP_WEBHOOK_SECRET`) e do e-mail (`EMAIL_SMTP_*`). Use `lume` minúsculo no `DB_NAME` (servidores Linux são sensíveis a maiúsculas). Sem `EMAIL_SMTP_PASS`, o código de verificação é impresso no console do backend.

**b) Instale as dependências, crie as tabelas e popule:**

```console
cd backend
npm install
npm run migrate      # cria as tabelas (usuarios, produtos, pedidos, favoritos...)
npm run seed         # insere os 18 produtos e os universos
npm run seed:admin   # cria/eleva o admin (senha via ADMIN_SENHA ou gerada)
```

**c) Inicie o servidor e rode os testes:**

```console
npm run dev          # http://localhost:4000
npm test             # 4 suítes / 32 testes
```

> O frontend já está ligado à API (cadastro com verificação, login, favoritos e finalização de compra).
> Em produção, defina `VITE_API_URL` no frontend apontando para a URL da API.

## 🐳 Docker (igual em qualquer máquina)

```console
docker compose up --build                      # banco + backend (migrate roda na subida)
docker compose run --rm backend npm run seed   # só na primeira vez
```

> - Backend em `http://localhost:4000`, banco na porta `5434` (a mesma do `backend/.env`).
> - Se o container antigo `lume-db` estiver no ar, pare antes: `docker stop lume-db`.
> - Em produção: `NODE_ENV=production docker compose up --build` — as travas do `env.js` exigem `JWT_SECRET` forte (≥32 chars), `CLIENTE_ORIGEM` sem localhost e `DB_PASSWORD` forte; sem isso o servidor **recusa iniciar**.

## 💳 Pagamento real com Mercado Pago

Sem configuração, o checkout é **simulado**: cria o pedido, marca como `pago` e baixa o estoque na hora, **sem cobrar ninguém**.

Para cobrar de verdade, siga o passo a passo completo em **[Normas.md](./Normas.md)**. Resumo:

1. Crie uma aplicação em [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers) e copie o **Access Token**
2. No `backend/.env`, preencha:
   ```env
   MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxx
   BACKEND_URL=http://localhost:4000            # URL pública (ex.: túnel ngrok em testes)
   MP_WEBHOOK_SECRET=xxxxxxxxxxxx               # segredo do painel → valida o x-signature
   ```
3. Ao finalizar a compra, o cliente é redirecionado para o checkout do Mercado Pago (Pix, cartão ou boleto)
4. O webhook `POST /api/pagamentos/webhook` valida a assinatura (`id/request-id/ts` em HMAC-SHA256), **confere o valor pago com o total do banco** e só então o pedido vira `pago` e o estoque é baixado
5. Pedidos `pending` (Pix aguardando) **não** são cancelados; só `rejected/canceled/expired` devolvem o estoque

> Com o gateway ativo, os dados do cartão **não** passam pelo seu servidor — o Mercado Pago processa o pagamento diretamente. O pedido guarda apenas o método e o status.

## 🔌 Endpoints da API

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| `GET` | `/api/health` | Health do serviço (checa o banco; 503 se indisponível) | — |
| `POST` | `/api/auth/registrar` | Cria conta e envia o código de verificação | — |
| `POST` | `/api/auth/verificar` | Confirma o código de 6 dígitos (10 min, 5 tentativas) | — |
| `POST` | `/api/auth/reenviar-verificacao` | Reenvia o código com cooldown | — |
| `POST` | `/api/auth/login` | Entra (exige e-mail verificado) e devolve token JWT | — |
| `GET` | `/api/auth/perfil` | Consulta o usuário logado no banco | Token |
| `GET` | `/api/produtos` | Lista o catálogo | — |
| `GET` | `/api/produtos/:id` | Detalhe de um produto | — |
| `POST` | `/api/produtos` | Cria produto | Admin |
| `PUT` | `/api/produtos/:id` | Atualiza produto | Admin |
| `DELETE` | `/api/produtos/:id` | Remove produto | Admin |
| `GET` | `/api/generos` | Lista os universos | — |
| `GET` | `/api/generos/:id` | Detalhe do universo | — |
| `POST` | `/api/generos` | Cria universo | Admin |
| `PUT` | `/api/generos/:id` | Atualiza universo | Admin |
| `DELETE` | `/api/generos/:id` | Remove universo | Admin |
| `GET` | `/api/favoritos` | Lista favoritos do usuário | Token |
| `POST` | `/api/favoritos/:produtoId` | Adiciona favorito | Token |
| `DELETE` | `/api/favoritos/:produtoId` | Remove favorito | Token |
| `POST` | `/api/pedidos` | Checkout (exige sessão — sem token → 401) | Obrigatória |
| `GET` | `/api/pedidos` | Lista pedidos do usuário | Token |
| `GET` | `/api/pagamentos/status` | Informa se o gateway está ativo | — |
| `POST` | `/api/pagamentos/preferencia` | Cria o checkout no Mercado Pago | Obrigatória |
| `POST` | `/api/pagamentos/webhook` | Confirma o pagamento (assinatura validada) | — |
| `GET` | `/api/pagamentos/webhook` | Validação/health do webhook do MP | — |
| `POST` | `/api/newsletter` | Assina a newsletter | — |

## 🧪 Testes

```console
cd backend
npm test        # Jest — 6 suítes, 47 testes
```

Cobertura: cadastro/login e **verificação de e-mail**, health (banco), catálogo de produtos e a **assinatura do webhook** do Mercado Pago (manifesto oficial `id/request-id/ts`, timing-safe), portões de compra (401 sem sessão) e as **travas de produção do `env.js`** (o servidor recusa subir com segredo fraco, CORS localhost ou senha de banco padrão). O fluxo de checkout também foi validado de ponta a ponta com Postgres real — incluindo a **corrida de estoque** (8 checkouts simultâneos de 5 peças em um estoque de 20).

## 🌐 Deploy (GitHub Pages)

**Site publicado:** https://matheus2henrique.github.io/Lume/

```console
cd frontend
npm run deploy    # build automático (predeploy) + push na branch gh-pages
```

> - O script usa o **git do Windows** (sua credencial já é reconhecida) e faz `push --force` na `gh-pages`.
> - **Alternativa automática:** o workflow `.github/workflows/deploy.yml` publica a cada push no `main` (uma vez: Settings → Pages → Source = "GitHub Actions").
> - **Sem `VITE_API_URL` o site publicado usa o catálogo mock** — as chamadas para `localhost:4000` falham e o fallback entra. Quando o backend estiver hospedado, defina a variável `VITE_API_URL` no build (variável do Actions ou `set VITE_API_URL=https://sua-api.com && npm run deploy`).

## 📜 Scripts

### Frontend (`frontend/`)

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o dev server com hot reload |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Pré-visualiza a build de produção |
| `npm run lint` | Executa o ESLint |
| `npm run deploy` | Build + publica na branch `gh-pages` (GitHub Pages) |

### Backend (`backend/`)

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor com hot reload (porta `4000`) |
| `npm run start` | Inicia o servidor em produção |
| `npm run migrate` | Aplica o schema no PostgreSQL |
| `npm run seed` | Popula produtos e universos (só se as tabelas estiverem vazias) |
| `npm run seed:admin` | Cria/eleva o admin inicial (senha via `ADMIN_SENHA` ou gerada) |
| `npm run seed:generos` | Popula apenas os universos |
| `npm test` | Roda a suíte Jest (4 suítes / 32 testes) |

## 📐 Normas e boas práticas

Consulte **[Normas.md](./Normas.md)** para:

- Como **criar** e **configurar** a API do **Mercado Pago** (token, credenciais de teste, webhook, ngrok)
- Como o **banco de dados** está estruturado (tabelas, migração, seed, backup — no Windows, use o **Agendador de Tarefas**)
- Regras de segurança (senha, JWT, `.env`, dados de cartão, webhook)
- Atenção a **maiúsculas** em nomes de banco/tabela e à porta real do seu PostgreSQL

## ✅ Checklist de produção

> 📄 **Passo a passo completo com links e onde pegar cada credencial:** **[CONFIGURACOES_EXTERNAS.md](./CONFIGURACOES_EXTERNAS.md)** (Mercado Pago, SMTP, hospedagem, GitHub Pages, Google, backup…).

**Já pronto (23/09):**

- [x] `JWT_SECRET` forte no `.env` + **travas**: com `NODE_ENV=production` o servidor **recusa iniciar** com segredo fraco/placeholder, CORS localhost ou senha de banco `postgres` (testado em `__tests__/env.test.js`)
- [x] Headers de segurança completos via `helmet` (HSTS, CSP `default-src 'none'`, `X-Frame-Options: DENY`, nosniff, CORP, Referrer-Policy)
- [x] **CI** no GitHub Actions: testes (47) + `npm audit` (bloqueia backend) + lint/build do frontend + build da imagem Docker — a cada push/PR
- [x] **Deploy** do workflow na raiz (estava em `frontend/.github/`, onde o GitHub não lê) com `VITE_API_URL` via variável
- [x] **Docker**: `backend/Dockerfile` (node:22-alpine, usuário sem privilégios, healthcheck) + `docker-compose.yml` (api + postgres)
- [x] Compra só com sessão; verificação de e-mail por código de 4–6 dígitos

**Falta você (precisa de credenciais/seu clique):**

- [ ] **SMTP**: preencher `EMAIL_SMTP_USER` / `EMAIL_SMTP_PASS` em `backend/.env` (ex.: senha de app do Gmail) — sem isso os códigos só vão para o log
- [ ] **Hospedar o backend** (Render/Railway/VPS + banco gerenciado): subir a imagem com `NODE_ENV=production`, `TRUST_PROXY=true` e `CLIENTE_ORIGEM`/`BACKEND_URL` com o domínio
- [ ] **Mercado Pago real**: `MP_ACCESS_TOKEN` + `MP_WEBHOOK_SECRET` + um pagamento de ponta a ponta (hoje o pagamento é simulado)
- [ ] **GitHub**: Settings → Pages → Source = "GitHub Actions" e variável `VITE_API_URL` (Settings → Secrets and variables → Actions → Variables)
- [ ] `npm audit fix` no **Windows** (4 advisories em ferramentas de build do frontend) e Dependabot em Settings → Security
- [ ] Recuperação de senha, backup + restore testado (ver [PLANO_PRODUCAO.md](./PLANO_PRODUCAO.md))

## 🗺️ Próximos passos

> O plano completo (com prioridades e esforço) está em **[PLANO_PRODUCAO.md](./PLANO_PRODUCAO.md)**.

- [x] Integração com backend e banco de dados (PostgreSQL)
- [x] Autenticação e cadastro de usuários
- [x] Verificação de e-mail por código no cadastro (SMTP ou modo dev)
- [x] Favoritos persistidos por usuário
- [x] Checkout com pagamento e baixa de estoque (exige conta logada)
- [x] Estrutura do gateway Mercado Pago (preferência + webhook)
- [x] Validar assinatura do webhook (`x-signature`) — requer `MP_WEBHOOK_SECRET`
- [x] Consumir `/api/produtos` no frontend (catálogo ligado à API)
- [x] Testes automatizados com Jest (`npm test`)
- [x] Deploy do frontend no GitHub Pages (`npm run deploy`)
- [ ] Ativar gateway com credenciais reais do Mercado Pago
- [ ] Hospedar o backend e publicar `VITE_API_URL` no build do frontend
- [ ] Tela de pedido pago/histórico para cliente e dono da loja
- [ ] Upload de modelos customizados pelos usuários
- [ ] Login com Google no backend

## 📄 Licença

Este projeto é privado e de uso exclusivo da **Lume**. Todos os direitos reservados.
