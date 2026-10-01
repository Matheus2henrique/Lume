# Plano: Melhor Envio no projeto Lume — cálculo de frete com sugestão de transportadoras

# opencode -s ses_f1135e28dffeFI0MHSsOTgY7E8

> Documento teórico/plano. Nenhum código foi alterado para gerá-lo.

## 1. Resumo em uma frase

O cliente digita o **CEP** no carrinho → o **backend** chama a API do Melhor Envio (`POST /api/v2/me/shipment/calculate`) com peso/dimensões dos produtos → a API devolve **N opções** (Correios PAC, SEDEX, Jadlog, Loggi...) com **preço e prazo** → o cliente **escolhe uma antes de pagar** → o frete escolhido entra no **total** do pedido → depois que o pagamento cair, a loja **compra a etiqueta** e ganha o **código de rastreio**.

---

## 2. O que é necessário (fora do código)

| Necessidade | Onde conseguir | Observação |
|---|---|---|
| Conta gratuita | melhorenvio.com.br | Sem custo para cotar |
| **Token de API** (OAuth2) | Painel → API/Aplicações → fluxo de autorização | Permissões mínimas: `shipping-calculate`; para a fase 2: `shipping-checkout`, `shipping-generate`, `shipping-print`, `shipping-tracking`, `orders-read` |
| **CEP de origem** (sua loja) | Configure no perfil do Melhor Envio | Usado como `from.postal_code` |
| **Saldo na carteira** | Só na fase 2 (comprar etiqueta) | Cotação é grátis; só paga ao comprar |
| Sandbox | sandbox.melhorenvio.com.br | Testa sem gastar saldo |
| Endereço remetente completo | Perfil → Endereços | Rua, número, bairro, cidade, UF |

> **Regra de ouro:** o token **NUNCA** vai para o frontend. Toda chamada passa pelo backend (mesma filosofia do `MP_ACCESS_TOKEN`).

---

## 3. Como a API funciona (o básico)

**URLs base:**
- Produção: `https://melhorenvio.com.br`
- Sandbox: `https://sandbox.melhorenvio.com.br`

**Headers obrigatórios** (a API recusa sem eles):

```
Authorization: Bearer SEU_TOKEN
Accept: application/json
Content-Type: application/json
User-Agent: Lume (seu-email@contato.com)   ← OBRIGATÓRIO, nome do app + email
```

**Endpoint da cotação:**

```
POST /api/v2/me/shipment/calculate
```

**Request (exemplo real):**

```json
{
  "from": { "postal_code": "45000000" },
  "to":   { "postal_code": "01018020" },
  "products": [
    {
      "id": "Camiseta Lume",
      "width": 20,
      "height": 5,
      "length": 25,
      "weight": 0.4,
      "insurance_value": 79.90,
      "quantity": 2
    }
  ],
  "options": { "receipt": false, "own_hand": false },
  "services": "1,2,18"
}
```

- Dimensões em **centímetros (cm)**, peso em **quilogramas (kg)**.
- `insurance_value` = valor unitário do produto em R$ (a API multiplica por `quantity`).
- `services` é **opcional**: omitir o campo retorna todas as transportadoras disponíveis para o trecho.

**Response (o que vira os cards de sugestão):**

```json
[
  {
    "id": 1,
    "name": "Correios PAC",
    "price": "24.50",
    "discount": "6.12",
    "delivery_time": 8,
    "delivery_range": { "min": 6, "max": 10 },
    "company": { "id": 1, "name": "Correios", "picture": "https://..." }
  },
  {
    "id": 2,
    "name": "Correios SEDEX",
    "price": "38.90",
    "delivery_time": 3,
    "delivery_range": { "min": 3, "max": 4 },
    "company": { "id": 1, "name": "Correios", "picture": "https://..." }
  }
]
```

→ Cada item = **uma sugestão de transportadora** com preço, prazo e logo.

---

## 4. O que falta no projeto HOJE (diagnóstico)

| O que a API exige | O que o projeto tem hoje | Lacuna |
|---|---|---|
| `to.postal_code` (CEP) | `endereco` é texto livre: *"Rua, número, bairro, cidade"* (`backend/src/schema.sql`, `frontend/src/components/pages/Carrinho.jsx`) | ❌ Sem campo CEP estruturado |
| `products[].weight/dimensions` | Tabela `produtos` só tem nome/preço/estoque (`schema.sql`) | ❌ Sem peso/altura/largura/comprimento |
| `insurance_value` | `preco` existe | ✅ Já dá |
| Frete no total | `pedidos.total = só soma dos produtos` (`backend/src/routes/pedidos.js`) | ❌ Frete não existe |
| Origem (`from`) | Nada | ❌ Precisa vir do `.env` |

---

## 5. Fluxo alvo (diagrama)

```
┌──────────── FRONTEND (Carrinho.jsx) ────────────┐
│ Etapa "dados":                                  │
│  1. Cliente digita CEP (00000-000)              │
│  2. ViaCEP preenche rua/bairro/cidade/UF        │
│  3. api.calcularFrete({ cepDestino, itens })    │
│  4. Mostra cards: [PAC R$24,50 6-10d] [SEDEX..]│
│  5. Cliente ESCOLHE um → estado `freteEscolhido`│
│  6. Total = produtos + frete                    │
└─────────────────────┬───────────────────────────┘
                      │ POST /api/frete/calcular
┌─────────────────────▼───── BACKEND ─────────────┐
│ routes/frete.js (novo)                          │
│  - valida CEP (e os itens, se vierem)                 │
│  - monta products[] somando qtd dos itens       │
│  - chama services/melhorEnvio.js                │
│    └─ POST melhorenvio.com.br/api/v2/me/        │
│         shipment/calculate  (com Bearer)        │
│  - devolve lista de opções                      │
├─────────────────────────────────────────────────┤
│ routes/pedidos.js (ALTERADO)                    │
│  - recebe `frete: { servicoId, valor, prazo }`  │
│  - REVALIDA o valor no servidor (não confia     │
│    no valor vindo do browser)                   │
│  - total = produtos + frete                     │
│  - grava frete + CEP no snapshot do pedido      │
└─────────────────────────────────────────────────┘
```

---

## 6. Alterações concretas (arquivo por arquivo)

### 6.1 `backend/.env` + `backend/src/env.js` — novas variáveis

```ini
# MELHOR ENVIO (frete)
ME_TOKEN=                 # vazio = frete desativado (mesmo padrão do MP)
ME_AMBIENTE=sandbox       # sandbox | production
ME_CEP_ORIGEM=00000000    # CEP da loja
ME_SERVICOS=              # opcional: "1,2,18" para limitar transportadoras
ME_CONTATO=email@loja.com  # usado no header User-Agent
```

Em `env.js`, adicionar com `envalid` (`str`, opcional) — igual ao tratamento de `MP_ACCESS_TOKEN`. Atualizar também o `backend/.env.example` com comentários.

### 6.2 `backend/src/schema.sql` — migração (padrão `DO $$` já usado no arquivo)

```sql
-- Peso e dimensões para cotação (cm e kg)
ALTER TABLE produtos ADD COLUMN peso        NUMERIC(6,3);  -- kg
ALTER TABLE produtos ADD COLUMN altura      NUMERIC(6,2);  -- cm
ALTER TABLE produtos ADD COLUMN largura     NUMERIC(6,2);
ALTER TABLE produtos ADD COLUMN comprimento NUMERIC(6,2);

-- Endereço estruturado do cliente
ALTER TABLE clientes ADD COLUMN cep    TEXT NOT NULL DEFAULT '';
ALTER TABLE clientes ADD COLUMN numero TEXT NOT NULL DEFAULT '';
ALTER TABLE clientes ADD COLUMN bairro TEXT NOT NULL DEFAULT '';
ALTER TABLE clientes ADD COLUMN cidade TEXT NOT NULL DEFAULT '';
ALTER TABLE clientes ADD COLUMN uf     TEXT NOT NULL DEFAULT '';

-- Frete escolhido no pedido
ALTER TABLE pedidos ADD COLUMN frete JSONB;
-- {"servicoId":1,"servico":"Correios PAC","valor":24.50,
--  "prazoMin":6,"prazoMax":10,"cep":"45000000","cotado_em":"..."}
ALTER TABLE pedidos ADD COLUMN rastreio TEXT;   -- fase 2
```

### 6.3 `backend/src/services/melhorEnvio.js` (NOVO — espelho de `mercadoPago.js`)

Responsabilidades:

- `freteAtivo()` → `Boolean(env.ME_TOKEN)` (igual `gatewayConfigurado()`)
- `calcularFrete({ cepOrigem, cepDestino, products })` → `fetch` para `${ME_URL}/api/v2/me/shipment/calculate` com os 4 headers, timeout ~10s, trata 401 (token inválido), 422 (payload/dimensão inválida), 500.
- Monta `products[]` agrupando por produto: `id, width, height, length, weight, insurance_value (preco), quantity`.
- Normaliza a resposta: `{ servicoId, servico: name, valor: parseFloat(price), prazoMin: delivery_range.min, prazoMax: delivery_range.max, transportadora: company.name, logo: company.picture }`.
- Log com `logger` (mesmo estilo dos outros services).

### 6.4 `backend/src/routes/frete.js` (NOVO)

```
GET  /api/frete/status     (público) → { ativo }

POST /api/frete/calcular   (público + limiterFrete — serve o simulador da home
                            e o carrinho; a cotação não expõe segredo, só preço/prazo)
  body: { cep, itens?: [{ produtoId, quantidade }] }
  1. valida CEP: /^\d{8}$/ (aceita "00000-000" e normaliza)
  2. SEM `itens` → cota a encomenda padrão (simulação pública, sem consultar o banco)
     COM `itens` → valida (mesma regra de pedidos.js: produtoId inteiro, qtd 1..999),
     SELECT produtos WHERE id = ANY(...) e monta products[]
  3. chama o service (ME_CEP_ORIGEM só é lido aqui — nunca sai na resposta)
  4. devolve { ativo: true, cep, pacote: 'carrinho'|'padrao', opcoes: [...] }
  5. se ME_TOKEN vazio → 200 { ativo: false, cep: null, pacote: null, opcoes: [] }
     (frontend esconde a seção de frete e segue sem frete — como faz hoje)
```

Registrar no `server.js`: `app.use('/api/frete', freteRouter)` (junto dos outros, linhas ~89-95).

### 6.5 `backend/src/routes/pedidos.js` (ALTERADO — pontos exatos)

1. **Leitura do body**: aceitar `frete` junto de `cliente, itens, pagamento`.
2. **Validação**: se `frete` vier, exigir `servicoId` inteiro e `cep` com 8 dígitos.
3. **Recálculo servidor-side** (junto do loop de total):
   - chama `calcularFrete()` de novo **no backend** com os produtos do banco;
   - procura a opção com o `servicoId` escolhido;
   - se não achar → `400 "Opção de frete não disponível. Recalcule."`;
   - `total += valorEncontrado` (o valor do browser é **ignorado** — evita cliente fraudar o total).
4. **Persistência** (INSERT): gravar `frete` (JSONB) e somar no `total`.
5. **Snapshot** (`cliente_dados`): incluir `cep`.
6. **Idempotência** (`hashIdempotencia`): incluir `cep + servicoId` no hash — senão o mesmo carrinho com frete diferente cairia no mesmo pedido.

### 6.6 `backend/src/routes/produtos.js` + `ProdutoFormModal.jsx` (ALTERADO)

- `POST/PUT /api/produtos`: aceitar e validar `peso, altura, largura, comprimento` (≥0; se tudo null → produto fica "sem frete" e a cotação o ignora com aviso no log).
- Modal admin: 4 inputs novos ("Peso (kg)", "Altura (cm)", "Largura (cm)", "Comprimento (cm)").

### 6.7 `frontend/src/api.js` (ALTERADO)

```js
calcularFrete: (dados) => requisicao('/frete/calcular', { metodo: 'POST', corpo: dados }),
```

### 6.8 `frontend/src/components/pages/Carrinho.jsx` (ALTERADO — etapa `dados`)

Novo bloco entre "Endereço" e "Pagamento":

```
┌──────────────────────────────────────┐
│ Calcular frete                       │
│ [ 00000-000 ]  [Calcular]            │  ← máscara de CEP, blur dispara cálculo
│                                      │
│ ● PAC — Correios      R$ 24,50  ✓   │  ← selecionado por padrão (mais barato)
│   Chega em 6 a 10 dias               │
│ ○ SEDEX — Correios    R$ 38,90       │
│   Chega em 3 a 4 dias                │
│ ○ Jadlog Package      R$ 21,90       │
│   Chega em 5 a 8 dias                │
│                                      │
│ Subtotal ......... R$ 159,80         │
│ Frete (PAC) ....... R$  24,50        │  ← novo
│ TOTAL ............. R$ 184,30        │
└──────────────────────────────────────┘
```

- Estados novos: `cep`, `opcoes`, `freteEscolhido`, `carregandoFrete`, `erroFrete`.
- Ao trocar de opção → só atualiza o total localmente.
- Ao **remover item / alterar quantidade** → recalcular (ou desmarcar frete e pedir novo cálculo).
- `handleFinalizar` envia `frete: { servicoId, cep }` no body.
- Se `opcoes` vier vazia/desativada → mantém o comportamento atual (sem frete), sem quebrar nada.
- Validação: **não permite finalizar sem escolher frete** quando o cálculo está ativo.

### 6.9 `PedidoStatus.jsx` e `Admin.jsx` (ALTERADO — cosmético)

- Exibir bloco "Entrega": endereço completo + `frete.servico`, `frete.valor`, prazo.
- No Admin: mostrar frete por pedido (entra no cálculo de margem).

### 6.10 `frontend/src/components/sections/SimuladorFrete.jsx` (NOVO — simulador da home)

- Seção logo abaixo de "Destaques da loja" (`Entrada.jsx`), com o título
  **"Simule o valor do frete"**.
- Formulário: CEP* (máscara), Número, Endereço, Bairro, Cidade, UF. O ViaCEP
  preenche rua/bairro/cidade/UF ao completar o CEP; **só o CEP vai ao backend** —
  o CEP da loja (`ME_CEP_ORIGEM`) nunca é exibido.
- Chama `POST /api/frete/calcular` (público): manda os `itens` do `localStorage`
  quando há carrinho (estimativa mais justa) ou nenhum `itens` (encomenda padrão);
  se um produto saiu da loja, refaz a chamada sem `itens`.
- Resultado: "A partir de R$ …", lista das transportadoras com prazo (a mais barata
  em destaque) e nota do que foi simulado.
- Sem token configurado a mesma rota responde `ativo: false` e a seção mostra
  "cálculo indisponível" — a home continua íntegra.

---

## 7. Erros clássicos e como se proteger

| Risco | Solução |
|---|---|
| Cliente manda `valor: 0` no frete | Backend **recalcula sempre** e ignora o valor do body |
| Token vazando no bundle do React | Só backend chama a API (proxy) |
| Header `User-Agent` ausente → 400 | Sempre enviar `Lume (email)` |
| Dimensões null → 422 | Defaults documentados (ex.: 20×15×5 cm, 0.4 kg) ou produto excluído da cotação |
| Cotação muda entre mostrar e cobrar | Recalcular no `POST /pedidos`; se divergir → erro "recalcule" |
| Rate limit do Melhor Envio | Cache curto da cotação (ex.: 5 min por CEP+itens) ou reaproveitar resposta no mesmo checkout |
| CEP com máscara | Normalizar para 8 dígitos antes de enviar |
| Frete grátis (regra sua) | Backend pode devolver `valor: 0` na escolha, mas ainda pagar a etiqueta real na fase 2 |

---

## 8. Rastreamento: dá para rastrear o produto pelo Melhor Envio?

**SIM — dá, com dois níveis:**

### Nível 1 — Status do envio (oficial, via API)

```
POST /api/v2/me/shipment/tracking
Authorization: Bearer TOKEN
{ "orders": ["uuid-da-etiqueta-1", "uuid-2"] }
```

Retorno:

```json
{
  "164ad792-...": {
    "status": "posted",
    "tracking": "ME23002OWZ7BR",
    "melhorenvio_tracking": "ME23002OWZ7BR",
    "paid_at": "...",
    "posted_at": "...",
    "delivered_at": null
  }
}
```

- Status possíveis: `pending` → `released` → `posted` → `delivered` (também `undelivered`, `suspended`, `canceled`).
- **Cache de 1 hora** nesse endpoint (documentado) — não consultar mais de 1x/h por envio.

### Nível 2 — Histórico detalhado (evento a evento)

- A API devolve o **código de rastreio**; o **timeline detalhado** se obtém consultando esse código no **Melhor Rastreio** (melhorrastreio.com.br) ou no site da transportadora (Correios etc.).
- Não há **webhook oficial** de rastreio → a forma de automatizar é **polling** (ex.: cron a cada 1h chamando o endpoint acima, salvando status no pedido).

### Na prática, para o projeto (fase 2):

1. Pagamento aprovado → backend compra etiqueta (`cart` → `checkout` → `generate`) → recebe `uuid` + `tracking`.
2. Grava `pedidos.rastreio = 'ME23002OWZ7BR'` e o uuid.
3. Cliente vê em `PedidoStatus`: **"Rastreio: ME23002OWZ7BR"** + link para o Melhor Rastreio.
4. Admin muda status para "enviado" (já existe o `PATCH /:id/status`) e, opcionalmente, um job consulta o ciclo de vida e atualiza para "entregue" sozinho.

---

## 9. Fluxo completo de compra de etiqueta (fase 2, referência)

```
1. POST /api/v2/me/cart              → adiciona a cotação ao carrinho (retorna cart_item id)
2. POST /api/v2/me/shipment/checkout  → compra usando o saldo da carteira
3. POST /api/v2/me/shipment/generate  → gera a etiqueta ({ "orders": ["uuid"] })
4. POST /api/v2/me/shipment/print     → retorna a URL do PDF para imprimir
5. POST /api/v2/me/shipment/tracking  → acompanha o status + código de rastreio
```

- A URL da etiqueta expira (cerca de 20 dias) — baixar o PDF logo após gerar se for arquivar.
- Permissões OAuth2 necessárias: `shipping-checkout`, `shipping-generate`, `shipping-print`, `shipping-preview`, `shipping-tracking`, `orders-read`.

---

## 10. Fases de implementação

| Fase | Entrega | Esforço |
|---|---|---|
| **1 (este plano)** | CEP + cotação + cards de transportadora + frete no total/pedido | Backend: 1 service + 1 rota + ajuste em `pedidos.js`; Frontend: ajuste no `Carrinho.jsx` |
| **2** | Compra de etiqueta, PDF, código de rastreio no pedido, status automático | Requer saldo na carteira + OAuth2 completo |
| **3** | Frete grátis condicional, cache de cotação, job de polling de rastreio | Opcional |

---

## 11. Checklist de aceite (fase 1)

- [ ] CEP inválido → mensagem clara, sem 500
- [ ] `ME_TOKEN` vazio → site funciona exatamente como hoje (sem frete)
- [ ] Cards mostram preço, prazo e transportadora
- [ ] Trocar a opção atualiza o total
- [ ] Total final = soma dos produtos + frete **recalculado no servidor**
- [ ] Pedido salva `frete` (JSONB) e o snapshot tem o CEP
- [ ] Nenhum token aparece no bundle do frontend (`npm run build` + grep)
- [ ] Testes Jest: rota de frete com token desativado / CEP inválido / payload normalizado

---

## Referências oficiais

- Documentação da API: https://docs.melhorenvio.com.br
- Cálculo de fretes por produtos: https://docs.melhorenvio.com.br/reference/calculo-de-fretes-por-produtos
- Status/rastreio de etiquetas: https://docs.melhorenvio.com.br/reference/rastreio-de-envios
- Fluxo de autorização (OAuth2 + scopes): https://docs.melhorenvio.com.br/reference/fluxo-de-autorizacao
- Sandbox: https://sandbox.melhorenvio.com.br
