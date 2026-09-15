# Normas e Guia de Configuração — Locus

Este documento reúne as normas do projeto e os passos para configurar a **API do Mercado Pago** e o **banco de dados PostgreSQL**.

## Índice

- [1. Banco de dados (PostgreSQL)](#1-banco-de-dados-postgresql)
  - [1.1 Configuração](#11-configuração)
  - [1.2 Estrutura das tabelas](#12-estrutura-das-tabelas)
  - [1.3 Migração e seed](#13-migração-e-seed)
  - [1.4 Boas práticas e backup](#14-boas-práticas-e-backup)
- [2. Gateway de pagamento — Mercado Pago](#2-gateway-de-pagamento--mercado-pago)
  - [2.1 Como criar a aplicação e obter o token](#21-como-criar-a-aplicação-e-obter-o-token)
  - [2.2 Credenciais de teste](#22-credenciais-de-teste)
  - [2.3 Como colocar no projeto](#23-como-colocar-no-projeto)
  - [2.4 Como o pagamento funciona no código](#24-como-o-pagamento-funciona-no-código)
  - [2.5 Testando localmente (ngrok + webhook)](#25-testando-localmente-ngrok--webhook)
  - [2.6 Cartões de teste](#26-cartões-de-teste)
  - [2.7 Segurança do webhook](#27-segurança-do-webhook)
- [3. Normas gerais de segurança](#3-normas-gerais-de-segurança)

---

## 1. Banco de dados (PostgreSQL)

### 1.1 Configuração

Todos os dados da aplicação ficam em um **PostgreSQL**, conectado pelo driver `pg`. A conexão é feita exclusivamente pelas variáveis de ambiente em `backend/.env`:

```env
DB_HOST=localhost        # host do banco
DB_PORT=5432             # porta padrão do PostgreSQL
DB_USER=postgres         # usuário
DB_PASSWORD=SUA_SENHA    # senha
DB_NAME=locus            # nome do banco
```

**Passos para criar o banco** (o schema não cria o banco, apenas as tabelas):

```bash
# com o psql (ajuste o caminho conforme a instalação do Windows)
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE locus;"
```

> Regra: **nunca** commit o `backend/.env`. Ele já está no `.gitignore`. Sempre use o `backend/.env.example` como modelo e documente novas variáveis ali.

### 1.2 Estrutura das tabelas

| Tabela | Finalidade | Observações |
|---|---|---|
| `usuarios` | Contas (login/registro) | `email` único, `senha_hash` (bcrypt), `provedor` |
| `clientes` | Dados de entrega por e-mail | `email` único; upsert automático no checkout |
| `produtos` | Catálogo | `preco NUMERIC`, `estoque INTEGER`, `permite_upload BOOLEAN` |
| `pedidos` | Pedidos/checkout | `itens JSONB`, `pagamento JSONB`, `status` |
| `favoritos` | Favoritos por usuário | PK `(usuario_id, produto_id)`, `ON DELETE CASCADE` |
| `assinaturas` | Clube Locus | `mundos JSONB`, `status` (`ativa`/`cancelada`) |

**Convenções** (seguir sempre ao evoluir o schema):

- Nomes de colunas em `snake_case`
- IDs `SERIAL PRIMARY KEY`
- Colunas de tempo `TIMESTAMPTZ NOT NULL DEFAULT now()`
- Dados flexíveis (itens, pagamento, mundos) em `JSONB`
- Chaves estrangeiras com `ON DELETE CASCADE` quando o filho não faz sentido sem o pai

### 1.3 Migração e seed

O schema é idempotente (`CREATE TABLE IF NOT EXISTS`), então pode rodar quantas vezes quiser:

```bash
cd backend
npm run migrate   # aplica src/schema.sql
npm run seed      # insere os 18 produtos só se a tabela estiver vazia
```

Ao adicionar uma tabela/coluna nova: edite `src/schema.sql` e rode `npm run migrate` novamente.

### 1.4 Boas práticas e backup

- **Consultas**: sempre usar *prepared statements* com placeholders `$1, $2...` (evita SQL injection). Nunca concatenar valores do usuário no SQL.
- **Operações atômicas** (ex.: baixar estoque + marcar pedido pago) usam **transações** (`BEGIN` / `COMMIT` / `ROLLBACK`) — veja `src/routes/pedidos.js` e `src/routes/pagamentos.js`.
- **Backup** do banco:
  ```bash
  "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U postgres locus > backup_locus.sql
  ```
- **Restore**:
  ```bash
  "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d locus -f backup_locus.sql
  ```

---

## 2. Gateway de pagamento — Mercado Pago

O Mercado Pago é a plataforma de pagamentos do Mercado Livre e aceita **Pix, cartão de crédito/débito e boleto**. O projeto já tem toda a estrutura integrada; falta apenas **gerar e configurar as credenciais**.

### 2.1 Como criar a aplicação e obter o token

1. Entre em [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers) com sua conta (ou crie uma conta Mercado Pago).
2. No menu **Suas integrações → Configurações** (ou "Minhas integrações"), clique em **Criar aplicação**.
3. Preencha nome e descrição da aplicação (ex.: "Locus Checkout").
4. Com a aplicação criada, abra **Credenciais de produção**.
5. Copie o campo **Access Token** — ele começa com `APP_USR-...`.

> Em alguns casos o Access Token de produção só fica visível após concluir a verificação da conta/empresa. Para desenvolvimento, use as credenciais de teste (§2.2) enquanto não estiver validado.

### 2.2 Credenciais de teste

Na mesma tela de credenciais, existe a chave **"Estou usando credenciais de teste"**. Ao ativá-la, você obtém:

- **Access Token de teste** — começa com `TEST-...`
- **Public Key** — `TEST-...` (pública, pode ficar no frontend se um dia usar Checkout Bricks)
- **Usuário de teste** — um e-mail/senha gerados para simular compradores

Com credenciais de teste **nenhum valor real é cobrado**. Use-as para validar o fluxo completo (pedido → redirecionamento → aprovação → webhook → estoque).

### 2.3 Como colocar no projeto

Edite `backend/.env`:

```env
# Token de produção (ou de teste para desenvolvimento)
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxx

# URL pública do seu backend — usada no webhook do Mercado Pago
BACKEND_URL=http://localhost:4000
```

Regras:

- `MP_ACCESS_TOKEN` **vazio** = checkout **simulado** (não cobra; baixa o estoque na hora). É o comportamento padrão.
- `MP_ACCESS_TOKEN` preenchido = checkout **real**: o pedido nasce `pendente`, o cliente é enviado ao Mercado Pago e o estoque só é baixado quando o pagamento é confirmado pelo webhook.
- `BACKEND_URL` precisa ser uma URL que o Mercado Pago consiga acessar (pública). Em produção é o domínio da API (ex.: `https://api.locus.com.br`); em desenvolvimento use um túnel **ngrok** (§2.5).

### 2.4 Como o pagamento funciona no código

Fluxo completo:

```
1. Frontend (Carrinho.jsx)
   POST /api/pedidos  { cliente, pagamento, itens }
   → pedido criado como "pendente" (se gateway ativo), sem baixar estoque

2. Frontend (Carrinho.jsx)
   POST /api/pagamentos/preferencia  { pedidoId, total, titulo, cliente }
   → services/mercadoPago.js chama:
     POST https://api.mercadopago.com/checkout/preferences
   → devolve init_point (URL do checkout do MP)

3. Frontend redireciona o navegador para o init_point
   → o cliente paga (Pix, cartão ou boleto) no ambiente do Mercado Pago

4. Mercado Pago avisa o seu backend
   POST /api/pagamentos/webhook  { type: "payment", data: { id } }

5. routes/pagamentos.js consulta o pagamento:
   GET https://api.mercadopago.com/v1/payments/:id
   → se status = "approved": pedido vira "pago" e o estoque é baixado (em transação)
```

Arquivos envolvidos:

| Arquivo | Papel |
|---|---|
| `backend/src/services/mercadoPago.js` | Chamadas à API do MP (`criarPreferencia`, `obterPagamento`, `gatewayConfigurado`) |
| `backend/src/routes/pagamentos.js` | Rotas `/preferencia` e `/webhook` |
| `backend/src/routes/pedidos.js` | Cria o pedido (`pendente` se gateway ativo) |
| `frontend/src/components/Carrinho.jsx` | Envia o pedido e redireciona ao `init_point` |
| `frontend/src/api.js` | `api.criarPreferencia(...)` |

### 2.5 Testando localmente (ngrok + webhook)

O webhook só funciona se o Mercado Pago alcançar o seu backend. Em desenvolvimento:

1. Instale o [ngrok](https://ngrok.com) e suba o backend:
   ```bash
   cd backend
   npm run dev
   ```
2. Em outro terminal, exponha a porta 4000:
   ```bash
   ngrok http 4000
   ```
3. Copie a URL `https://xxxx.ngrok-free.app` gerada e use-a no `.env`:
   ```env
   BACKEND_URL=https://xxxx.ngrok-free.app
   ```
4. Reinicie o backend. As preferências criadas agora levarão o Mercado Pago a chamar `https://xxxx.ngrok-free.app/api/pagamentos/webhook`.

> Alternativa sem ngrok: no painel do Mercado Pago você pode cadastrar a URL de webhook por aplicação, mas neste projeto a URL já é enviada em cada preferência (`notification_url`).

### 2.6 Cartões de teste

Com credenciais de teste, use os cartões fornecidos pelo Mercado Pago para simular pagamentos:

| Bandeira | Número | Vencimento | CVV |
|---|---|---|---|
| Mastercard | `5031 4332 1540 6351` | `11/25` | `123` |
| Visa | `4235 6477 2802 5682` | `11/25` | `123` |
| American Express | `3753 651535 56885` | `11/25` | `1234` |

Para simular **recusa** (pagamento negado), use o valor `999999999` como CVV. A lista oficial fica na documentação: *"Cartões de teste"* em developers.mercadopago.com.br.

### 2.7 Segurança do webhook

O webhook é um endpoint público — qualquer um pode chamá-lo. Para produção, o Mercado Pago assina as notificações e é **obrigatório validar** a assinatura antes de confirmar o pedido:

- Headers recebidos: `x-signature` e `x-request-id`
- Fórmula oficial: SHA-256 de `id:` + `data.id` + `request-id:` + `x-request-id` + `uri:` + caminho + `access_token:` + token, comparado com o valor de `x-signature` (com timestamp válido dentro de uma janela pequena)

Esse item está na lista de **próximos passos** do README. Até implementar, em produção prefira **não expor o backend com token real** ou restrinja o acesso por IP/segredo, e mantenha o `MP_ACCESS_TOKEN` com permissões mínimas.

---

## 3. Normas gerais de segurança

- **Nunca** commitar `backend/.env`, tokens, senhas ou chaves. O `.gitignore` já bloqueia `.env`.
- **Nunca** registrar tokens no console, em logs ou em mensagens de erro.
- **Senhas** sempre com `bcrypt` (nunca texto puro).
- **Dados de cartão** não devem trafegar pelo seu servidor quando o gateway estiver ativo — o Mercado Pago processa tudo; o backend guarda apenas `metodo` e `status`.
- **JWT**: o segredo `JWT_SECRET` deve ser longo e aleatório, diferente em produção.
- **Validação de entrada**: rotas públicas (login, checkout) validam campos obrigatórios antes de acessar o banco.
- **Transações** para qualquer operação que toque mais de uma tabela (pedido + estoque, pagamento + estoque).
- **Webhook** deve ser autenticado/validado antes de alterar estado de pedidos em produção.