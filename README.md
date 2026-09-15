# Locus — Loja de Impressão 3D (MVP)

**Loja virtual (MVP) de peças impressas em 3D sob demanda.** Catálogo por universos (Romance, Fantasia e Suspense), página de detalhes do produto, carrinho, checkout com pagamento (simulado ou Mercado Pago), favoritos e área de perfil com autenticação.

> Projeto em desenvolvimento — MVP funcional para validar a venda de modelos 3D personalizados produzidos sob demanda.

---

## Índice

- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Como rodar o projeto](#-como-rodar-o-projeto)
- [Pagamento real com Mercado Pago](#-pagamento-real-com-mercado-pago)
- [Endpoints da API](#-endpoints-da-api)
- [Scripts](#-scripts)
- [Normas e boas práticas](#-normas-e-boas-práticas)
- [Próximos passos](#-próximos-passos)
- [Licença](#-licença)

---

## ✨ Funcionalidades

- 🏷️ **Catálogo por universos** — Romance, Fantasia e Suspense, com filtro e página de detalhes
- 📄 **Página de detalhes** — preço, estoque, descrição, personalização com upload de arquivo e "Comprar agora"
- 🛒 **Carrinho** — adicionar, remover e alterar quantidade
- 💳 **Checkout** — dados de entrega + pagamento (cartão ou Pix), com redirecionamento ao **Mercado Pago** quando o gateway está ativo
- ❤️ **Favoritos** — persistidos no banco quando o usuário está logado
- 👤 **Perfil** — criar conta, entrar e consultar os dados no banco (`/api/auth/perfil`)
- 🔑 **Autenticação** — JWT + bcrypt no backend (senha nunca armazenada em texto puro)
- 🔄 **Navegação fluida** — rolagem suave e URLs amigáveis
- 🎨 **Design responsivo** — layout adaptável a diferentes tamanhos de tela

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

## 📁 Estrutura do projeto

```
MVP-grafica/
├── frontend/                    # Aplicação React + Vite
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── src/
│       ├── main.jsx             # Entry point
│       ├── App.jsx              # Componente raiz e navegação
│       ├── index.css            # Estilos globais (Tailwind)
│       ├── api.js               # Cliente HTTP do backend (fetch + token)
│       ├── data/produtos.js     # Dados dos produtos (mock)
│       └── components/
│           ├── Header.jsx       # Topo + menu
│           ├── Entrada.jsx      # Home
│           ├── Genero.jsx       # Catálogo de um universo
│           ├── Card.jsx         # Card de produto
│           ├── ProdutoDetalhe.jsx
│           ├── Carrinho.jsx     # Carrinho + checkout
│           ├── Perfil.jsx       # Login / registro / dados da conta
│           ├── Favoritos.jsx
│           ├── ClubeLocus.jsx   # Assinatura (planos)
│           ├── Footer.jsx
│           └── Icones.jsx
├── backend/                     # API Express + PostgreSQL
│   ├── package.json
│   ├── .env                     # ← CONEXÃO COM SEU BANCO + TOKEN DO MERCADO PAGO
│   ├── .env.example             # Modelo de configuração
│   └── src/
│       ├── server.js            # Servidor Express
│       ├── db.js                # Pool do PostgreSQL
│       ├── schema.sql           # Criação das tabelas
│       ├── migrate.js           # Aplica o schema (npm run migrate)
│       ├── seed.js              # Popula produtos (npm run seed)
│       ├── middleware/auth.js   # Proteção por token JWT
│       ├── services/
│       │   └── mercadoPago.js   # Integração com a API do Mercado Pago
│       ├── data/produtos.js     # Dados iniciais dos produtos
│       └── routes/
│           ├── auth.js          # registrar, login, perfil
│           ├── produtos.js      # catálogo
│           ├── favoritos.js     # favoritos por usuário
│           ├── pedidos.js       # checkout com pagamento + estoque
│           ├── assinaturas.js   # Clube Locus
│           └── pagamentos.js    # preferência + webhook do Mercado Pago
└── package-lock.json
```

## 🚀 Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org) **20.x ou superior** (recomendado)
- npm (incluído com o Node.js)
- [PostgreSQL](https://www.postgresql.org/download/) instalado e rodando (porta padrão `5432`)

### 1. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### 2. Backend (Express + PostgreSQL)

**a) Configure o banco** — edite `backend/.env` com os dados do seu PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=SUA_SENHA
DB_NAME=locus
```

**b) Instale as dependências, crie as tabelas e popule os produtos:**

```bash
cd backend
npm install
npm run migrate   # cria as tabelas (usuarios, clientes, produtos, pedidos, favoritos, assinaturas)
npm run seed      # insere os 18 produtos do catálogo
```

**c) Inicie o servidor:**

```bash
npm run dev       # http://localhost:4000
```

> O frontend já está ligado à API (login, cadastro, favoritos e finalização de compra).
> Em produção, defina `VITE_API_URL` no frontend apontando para a URL da API.

## 💳 Pagamento real com Mercado Pago

Sem configuração, o checkout é **simulado**: cria o pedido, marca como `pago` e baixa o estoque na hora, **sem cobrar ninguém**.

Para cobrar de verdade, siga o passo a passo completo em **[Normas.md](./Normas.md)**. Resumo:

1. Crie uma aplicação em [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers) e copie o **Access Token**
2. No `backend/.env`, preencha:
   ```env
   MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxx
   BACKEND_URL=http://localhost:4000   # URL pública (ex.: túnel ngrok em testes)
   ```
3. Ao finalizar a compra, o cliente é redirecionado para o checkout do Mercado Pago (Pix, cartão ou boleto)
4. O webhook `POST /api/pagamentos/webhook` confirma o pagamento; só então o pedido vira `pago` e o estoque é baixado

> Com o gateway ativo, os dados do cartão **não** passam pelo seu servidor — o Mercado Pago processa o pagamento diretamente.

## 🔌 Endpoints da API

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| `POST` | `/api/auth/registrar` | Cria conta (nome, email, senha) | — |
| `POST` | `/api/auth/login` | Entra e devolve token JWT | — |
| `GET` | `/api/auth/perfil` | Consulta o usuário logado no banco | Token |
| `GET` | `/api/produtos` | Lista o catálogo | — |
| `GET` | `/api/produtos/:id` | Detalhe de um produto | — |
| `GET` | `/api/favoritos` | Lista favoritos do usuário | Token |
| `POST` | `/api/favoritos/:produtoId` | Adiciona favorito | Token |
| `DELETE` | `/api/favoritos/:produtoId` | Remove favorito | Token |
| `POST` | `/api/pedidos` | Checkout (pagamento + baixa de estoque) | — |
| `GET` | `/api/pedidos` | Lista pedidos do usuário | Token |
| `GET` | `/api/pagamentos/status` | Informa se o gateway está ativo | — |
| `POST` | `/api/pagamentos/preferencia` | Cria o checkout no Mercado Pago | — |
| `POST` | `/api/pagamentos/webhook` | Confirma o pagamento (webhook do MP) | — |
| `POST` | `/api/assinaturas` | Ativa assinatura do Clube Locus | Token |
| `GET` | `/api/assinaturas` | Lista assinaturas do usuário | Token |

## 📜 Scripts

### Frontend (`frontend/`)

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o dev server com hot reload |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Pré-visualiza a build de produção |
| `npm run lint` | Executa o ESLint |

### Backend (`backend/`)

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor com hot reload (porta `4000`) |
| `npm run start` | Inicia o servidor em produção |
| `npm run migrate` | Aplica o schema no PostgreSQL |
| `npm run seed` | Popula produtos (só se a tabela estiver vazia) |

## 📐 Normas e boas práticas

Consulte **[Normas.md](./Normas.md)** para:

- Como **criar** e **configurar** a API do **Mercado Pago** (token, credenciais de teste, webhook, ngrok)
- Como o **banco de dados** está estruturado (tabelas, migração, seed, backup)
- Regras de segurança (senha, JWT, `.env`, dados de cartão, webhook)

## 🗺️ Próximos passos

- [x] Integração com backend e banco de dados (PostgreSQL)
- [x] Autenticação e cadastro de usuários
- [x] Favoritos persistidos por usuário
- [x] Checkout com pagamento e baixa de estoque
- [x] Assinaturas do Clube Locus (API)
- [x] Estrutura do gateway Mercado Pago (preferência + webhook)
- [ ] Ativar gateway com credenciais reais do Mercado Pago
- [ ] Validar assinatura do webhook (`x-signature`)
- [ ] Integrar assinatura na tela do Clube Locus
- [ ] Consumir `/api/produtos` no frontend (hoje o catálogo usa mock)
- [ ] Upload de modelos customizados pelos usuários
- [ ] Login com Google no backend

## 📄 Licença

Este projeto é privado e de uso exclusivo da **Gráfica 3D Store**. Todos os direitos reservados.