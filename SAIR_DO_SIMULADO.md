# 💳 Sair do simulado → cobrança real (Mercado Pago)

> Hoje o checkout **simula** o pagamento: o pedido nasce `pago`, baixa estoque na hora e **ninguém é cobrado**.
> Isso acontece porque `MP_ACCESS_TOKEN` está **vazio** no `backend/.env`.
>
> Este guia leva você do estado atual para **cobrança de verdade** (cartão e Pix), sem mexer em código — a integração Checkout Pro já está pronta.

---

## 🗺️ Visão geral

| Estado | O que acontece |
|---|---|
| **Simulado** (hoje) | Token vazio → pedido `pago` + `pagamento.status = 'simulado'` → sem redirect ao MP |
| **Real** | Token preenchido → pedido `pendente` → redirect ao **init_point** do MP → cliente paga **na página do Mercado Pago** → webhook → pedido `pago` + baixa de estoque |

**Importante:** os botões **Cartão** e **Pix** no carrinho só gravam o `metodo` do pedido. O cliente escolhe o método **dentro** da tela do Mercado Pago (Checkout Pro). **Não** digite dados de cartão no seu site.

---

## Etapa A — Access Token (sai do simulado)

### A1. Conta Mercado Pago

1. Crie/entre: https://www.mercadopago.com.br/registro
2. Use CPF ou CNPJ
3. Para **produção**, a conta precisa estar **verificada** (identidade/comprovante)

### A2. Criar aplicação

1. Painel de desenvolvedores: https://www.mercadopago.com.br/developers/panel/app
2. **Criar aplicação** → tipo **Loja/Site** → nome `Lume`

### A3. Copiar o Access Token

Dentro da aplicação → aba **Credenciais**:

| Token | Começa com | Serve para |
|---|---|---|
| Teste | `TEST-…` | Sandbox — **não cobra** dinheiro real |
| Produção | `APP_USR-…` | Cobrança real |

> ⚠️ Não confunda com a **Public Key** (é para o navegador; o backend não usa).

### A4. Colar no `backend/.env`

```env
MP_ACCESS_TOKEN=TEST-...        # primeiro teste
# ou
MP_ACCESS_TOKEN=APP_USR-...     # produção (cobra de verdade)
```

### A5. Reiniciar o backend

```console
cd backend
npm run dev
```

### ✅ Como conferir (já muda o comportamento)

1. `GET http://localhost:4000/api/pagamentos/status` → `{"gateway": true}`
2. No carrinho, aviso “pagamento simulado” **some** (ou inverte conforme o texto do frontend)
3. Finalizar compra → pedido nasce **`pendente`** → aparece *“Redirecionando para o Mercado Pago…”* → abre o checkout do MP

**Com a Etapa A o simulado acabou.** Etapa B deixa a confirmação automática.

---

## Etapa B — Webhook (pedido vira “pago” sozinho)

Sem webhook, o MP não avisa o backend: o pedido pode ficar `pendente` mesmo após pagar.

### B1. URL de notificação

Na aplicação → **Webhooks** → **Configurar notificação**:

```
https://SEU-BACKEND/api/pagamentos/webhook
```

- **Local (seu PC):** use ngrok (etapa B3)
- **Produção:** URL pública do servidor hospedado

O projeto **já envia** `notification_url` em cada preferência (`backend/src/services/mercadoPago.js`) — cadastrar no painel é reforço/botão de teste.

### B2. Gerar `MP_WEBHOOK_SECRET`

1. Mesma tela de Webhooks → **Gerar segredo**
2. Copie o valor
3. Cole no `backend/.env`:

```env
MP_WEBHOOK_SECRET=...
```

> Sem o segredo, a validação de assinatura é **ignorada** (só warning no log). Em produção é obrigatório.

### B3. ngrok (testar no seu computador)

Terminal 1 — backend:

```console
cd backend
npm run dev
```

Terminal 2 — túnel:

```console
ngrok http 4000
```

Cole a URL gerada (`https://xxxx.ngrok-free.app`) no `.env`:

```env
BACKEND_URL=https://xxxx.ngrok-free.app
```

Reinicie o backend. O MP passa a chamar:

```
https://xxxx.ngrok-free.app/api/pagamentos/webhook
```

> O `ngrok` muda a URL a cada sessão gratuita — atualize `BACKEND_URL` e a notificação no painel a cada reinício.

### B4. Testar o webhook no painel

Painel MP → Webhooks → botão **Testar** → resposta deve ser **`200/204`**.

### ✅ Como conferir

1. Pagar no checkout de teste
2. Log do backend: webhook recebido
3. Pedido em `/Lume/pedido/:id` → status **pago** + estoque baixado **sozinho**

---

## Etapa C — Validação ponta a ponta

### Com token `TEST-` (recomendado primeiro)

Cartões de teste do Mercado Pago (**não cobram**):

| Bandeira | Número | Vencimento | CVV |
|---|---|---|---|
| Mastercard | `5031 4332 1540 6351` | `11/25` | `123` |
| Visa | `4235 6477 2802 5682` | `11/25` | `123` |
| American Express | `3753 651535 56885` | `11/25` | `1234` |

- **Recusa simulada:** use CVV `999999999`
- Pix em sandbox: gerado na própria tela do MP (não é QR da loja)

### Checklist

- [ ] `MP_ACCESS_TOKEN` preenchido e backend reiniciado
- [ ] `GET /api/pagamentos/status` → `gateway: true`
- [ ] Checkout redireciona para o Mercado Pago
- [ ] Pagamento aprovado no sandbox → pedido `pago` + estoque baixa
- [ ] Webhook `200/204` no painel (etapa B)
- [ ] `MP_WEBHOOK_SECRET` preenchido (produção)
- [ ] Recusa (CVV inválido) → pedido **não** fica `pago`
- [ ] Pix pendente → pedido fica `pendente` até confirmar

---

## Passando para produção (`APP_USR-…`)

Quando o sandbox passar no checklist:

1. Troque `MP_ACCESS_TOKEN` pelo token **`APP_USR-…`**
2. Confirme conta MP **verificada**
3. `BACKEND_URL` = domínio **público** do backend hospedado (não localhost)
4. `MP_WEBHOOK_SECRET` = segredo da aplicação **de produção**
5. `CLIENTE_ORIGEM` = origem do site publicado (ex.: `https://seudominio.com`)
6. `NODE_ENV=production` + travas do `env.js` (JWT forte, senha de banco, etc.)
7. Repita o checkout com valor baixo ou método real da conta

> Variáveis de produção vão **também** no provedor de hospedagem (Render/Railway/VPS) — não só no `.env` local.

---

## Onde colar (mapa)

| Variável | Local | Produção |
|---|---|---|
| `MP_ACCESS_TOKEN` | `backend/.env` | env da hospedagem |
| `MP_WEBHOOK_SECRET` | `backend/.env` | env da hospedagem |
| `BACKEND_URL` | `localhost:4000` ou ngrok | `https://api.seudominio.com` |
| `CLIENTE_ORIGEM` | `http://localhost:5173` | `https://seudominio.com` |

Referência completa de cliques no painel: [`CONFIGURACOES_EXTERNAS.md`](CONFIGURACOES_EXTERNAS.md) — item **1. Mercado Pago**.

---

## Fluxo com cobrança ativa (referência)

```
Carrinho → Finalizar (login obrigatório)
  → POST /api/pedidos          → status: pendente
  → POST /api/pagamentos/preferencia
  → redirect init_point (página do MP)
       ├─ Cartão aprovado  → webhook approved  → pedido pago + estoque
       ├─ Pix              → pending → webhook → pedido pago quando confirmar
       └─ Recusa           → rejected → pedido cancelado
  → retorno /Lume/pedido/:id  (polling de status)
```

**Arquivos do fluxo (sem alteração necessária):**

| Arquivo | Papel |
|---|---|
| `frontend/src/components/pages/Carrinho.jsx` | Checkout, método, redirect ao `init_point` |
| `backend/src/routes/pedidos.js` | Cria pedido (`pendente` se gateway ativo) |
| `backend/src/routes/pagamentos.js` | Preferência + webhook |
| `backend/src/services/mercadoPago.js` | API do MP + assinatura do webhook |
| `frontend/src/components/pages/PedidoStatus.jsx` | Tela de status pós-pagamento |

---

## Solução de problemas

| Sintoma | Causa provável |
|---|---|
| Pedido ainda `pago` sem abrir o MP | `MP_ACCESS_TOKEN` vazio ou backend não reiniciou |
| Erro 503 na preferência | Gateway não configurado (`pagamentos.js`) |
| Pago mas pedido fica `pendente` | Webhook não chega (`BACKEND_URL`/ngrok) ou segredo errado |
| Webhook 401/403 | `MP_WEBHOOK_SECRET` ≠ chave do painel |
| `auto_return` / back_url quebrada | `CLIENTE_ORIGEM` diferente do site aberto |
| Preferência 400 do MP | Token de teste vs produção trocados, ou conta não verificada |

---

## Resumo em 3 passos

1. **Token** no painel MP → `MP_ACCESS_TOKEN` no `.env` → reiniciar → checkout abre o Mercado Pago  
2. **Webhook** + `MP_WEBHOOK_SECRET` (+ ngrok em dev) → pedido confirma sozinho  
3. **Validar** com cartão de teste → trocar por `APP_USR-…` em produção
