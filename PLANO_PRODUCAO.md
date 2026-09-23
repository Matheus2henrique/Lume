# Plano de Produção — Lume

Do MVP funcional para um projeto pronto para **vender de verdade**.

> **Situação em 23/09/2026:** backend corrigido, validado e com as travas de
> produção (ver [O que já foi feito](#-o-que-já-foi-feito-nesta-rodada)).
> **MVP fechado na mesma data:** carrinho persistente, personalização
> entregue, tela `/pedido/:id`, painel de pedidos e recuperação de senha
> — **78 testes verdes**.
> Esforço estimado até produção: **2 a 3 semanas** de trabalho focado (1 pessoa)
> — Fase 0 de código concluída; resta credencial/hospedagem/backup (S) + Fase 1.

**Legenda de esforço:** S = menos de 1 dia · M = 1 a 3 dias · L = 1 semana
**Prioridade:** 🔴 bloqueia produção · 🟠 segurança/qualidade · 🟡 crescimento

---

## ✅ O que já foi feito nesta rodada

| Problema encontrado | Situação |
|---|---|
| Backend não compilava (`:` em `pagamentos.js`) | ✅ corrigido — servidor sobe |
| `npm test` quebrado + 2 suítes falhando | ✅ **19/19 testes verdes** |
| `npm run seed` quebrado (`rowCount[0]`) | ✅ corrigido — populou 18 produtos + 5 gêneros |
| Senhas de admin fixas no código (`123456`, `admin123`) | ✅ via `.env` ou senha gerada |
| Dados de cartão salvos no banco (violação PCI) | ✅ backend só grava `metodo`/`status`; frontend não coleta mais cartão |
| Manifesto da assinatura do webhook errado (pagamento nunca confirmaria) | ✅ manifesto oficial + HMAC em tempo constante |
| Webhook cancelava pedido Pix em `pending` | ✅ só cancela em `rejected`/`cancelled`/`expired` |
| Preço cobrado vinha do cliente (possível fraude) | ✅ total sai sempre do banco + confere `transaction_amount` |
| Convidado não conseguia pagar (403 no gateway) | ✅ `checkoutToken` JWT de 30 min |
| Corrida de estoque (oversell) | ✅ `FOR UPDATE` — validado com 8 checkouts simultâneos |
| `/api/health` mentia (sempre ok) | ✅ checa o banco, devolve 503 se cair |
| Rate limit com IP errado atrás de proxy | ✅ `TRUST_PROXY` (ativar em produção) |
| Upload de imagem dava erro 413 (>100kb) | ✅ limite para 10mb (temporário) |
| Compra sem login (guest) e código de verificação fraco | ✅ checkout exige sessão; código de 4–6 dígitos |
| `JWT_SECRET` era placeholder em `.env` | ✅ segredo de 64 caracteres gerado + **travas**: o servidor **recusa iniciar** em produção com segredo fraco, CORS localhost ou senha `postgres` (com teste) |
| Nenhum workflow do GitHub Actions rodava | ✅ **CI** (`.github/workflows/ci.yml`): testes + audit + lint/build + build Docker a cada push/PR |
| Deploy do frontend na pasta errada (`frontend/.github/`) | ✅ movido para `.github/workflows/deploy.yml` + `VITE_API_URL` via variável do repositório (item 0.3) |
| Só 4 headers manuais de segurança | ✅ **helmet@8** (HSTS, CSP `default-src 'none'`, frame DENY, CORP, Referrer-Policy) — validado com `curl -I` |
| Sem empacotamento reproduzível | ✅ `backend/Dockerfile` + `.dockerignore` + `docker-compose.yml` (api + postgres) — imagem buildada e compose validado |
| Sem encerramento gracioso / sem cabeçalhos de segurança | ✅ SIGTERM + `nosniff`/`X-Frame-Options` etc. |
| Deep link quebrava no GitHub Pages | ✅ `404.html` + restauração de rota |
| Docs desatualizadas (Normas.md, README) | ✅ atualizadas |
| Testes automatizados | ✅ 19 unitários/integração + **38 checagens E2E** (2 fases, Postgres real) |
| Cliente paga e não tem tela de status (back_urls voltavam para a home) | ✅ rota `/pedido/:id` com polling + `GET /api/pedidos/:id` (dono/admin); `back_urls` do MP agora apontam para ela |
| Dono não via pedidos (consultava o banco na mão) | ✅ aba **Pedidos** no admin: cliente, itens, endereço, download da personalização e `PATCH /:status` (baixa/devolve estoque com lock) |
| Loja vendia personalização que não entregava (arquivo só no state) | ✅ arquivo (data URL, até 5 MB) vai em `pedido.itens` e o admin baixa pelo painel — E2E validado com Postgres real |
| Carrinho sumia ao recarregar a página | ✅ persistido em `localStorage` (`utils/carrinho.js`), sem a imagem para não estourar a cota |
| Botão "Esqueci minha senha" morto | ✅ fluxo completo por código: `POST /api/auth/esqueci-senha` (resposta genérica) + `POST /api/auth/redefinir-senha` (HMAC, 10 min, 5 tentativas) |
| Testes/documentação desatualizados | ✅ **78 testes** (6 suítes) + README e plano atualizados |

---

## 🚨 Fase 0 — Virada de chave (semana 1)

**Nada disso pode faltar para aceitar dinheiro real.**

| # | Item | Por quê | Esforço |
|---|---|---|---|
| 0.1 | **Mercado Pago de produção**: criar aplicação, preencher `MP_ACCESS_TOKEN`, gerar o segredo do webhook (Suas integrações → Webhooks → Configurar notificação) em `MP_WEBHOOK_SECRET` e validar **um pagamento real de ponta a ponta** (ngrok/domínio → webhook → pedido `pago` → estoque baixado) | Sem segredo, a validação é ignorada com aviso; sem token real, nada cobra | M |
| 0.2 | **Hospedar o backend + banco gerenciado** (Render/Railway/VPS + Neon/Supabase/RDS): `TRUST_PROXY=true`, `CLIENTE_ORIGEM`/`BACKEND_URL` com o domínio, SSL no Postgres (`ssl` no pool — precisa de ajuste em `db.js` para o provedor). ~~`JWT_SECRET` novo e forte~~ ✅ feito + travas no `env.js` bloqueiam produção mal configurada; **falta só a hospedagem** (Dockerfile/compose prontos) | Hoje só roda na sua máquina | ~~M~~ **S** |
| 0.3 | ~~**Deploy automático do frontend**: mover `frontend/.github/workflows/deploy.yml` para `.github/workflows/` na raiz do repositório e definir `VITE_API_URL` no build~~ ✅ **feito em 23/09** — workflow na raiz, `VITE_API_URL` lida de `${{ vars.VITE_API_URL }}`. **Ação sua (1 clique):** Settings → Pages → Source = "GitHub Actions" + definir a variável | Site publicado está "casca vazia" | S |
| 0.4 | ~~**Tela de status do pedido**: `back_urls` do MP voltam para a home; criar rota `/pedido/:id` que consulta `GET /api/pedidos/:id` e mostra `pendente/pago` (com polling)~~ ✅ **feito em 23/09** — rota `/pedido/:id` com polling (para em status final), `back_urls` do MP apontam para ela, botão "Ver meu pedido" no checkout | Primeira impressão pós-compra | ~~M~~ **feito** |
| 0.5 | ~~**Painel de pedidos para o dono**: `GET /api/pedidos` (admin vê todos) + tela no Admin com status, itens, valor e mudança manual de status~~ ✅ **feito em 23/09** — `?todos=1` (admin) + aba Pedidos; `PATCH /api/pedidos/:id/status` com lock, baixa ao virar `pago` e devolução ao cancelar pedido pago | Loja não pode operar às cegas | ~~M~~ **feito** |
| 0.6 | **Backup antes do primeiro dia** + teste de restore (`pg_dump.exe` agendado no Agendador de Tarefas do Windows) | Sem restore testado, backup não existe | S |
| 0.7 | ~~**Atualizar README** (estrutura de pastas mudou: `layout/`, `pages/`, `ui/`; documentar endpoints `/generos`, `/newsletter` e CRUD admin)~~ ✅ **feito** — README com estrutura, tabela de endpoints completa (auth/pedidos/admin), 78 testes e checklist atualizados | Primeira impressão de quem entra no projeto | ~~S~~ **feito** |

---

## 🛠 Fase 1 — Operação profissional (semanas 2–3)

| # | Item | Por quê | Esforço |
|---|---|---|---|
| 1.1 | ~~**Recuperação/troca de senha** — o botão "Esqueci minha senha" é morto (`Perfil.jsx`); criar token por e-mail + rotas no backend~~ ✅ **feito em 23/09** — `esqueci-senha` (resposta genérica, só conta verificada) + `redefinir-senha` (HMAC, 10 min, 5 tentativas) + fluxo completo no `Perfil.jsx` | Conta sem saída = suporte manual | ~~M~~ **feito** |
| 1.2 | **E-mails transacionais** (confirmação de pedido, senha) via Resend/SES | Confiança + reduz chargeback/dúvida | M |
| 1.3 | **Upload de imagem real** (endpoint multipart + S3/R2) — hoje é base64 dentro do JSON (limitado a 10mb e incha o banco) | Banco leve e upload confiável | M |
| 1.4 | ~~**Upload de personalização de verdade** — `ProdutoDetalhe.jsx` só guarda o arquivo no state e **não existe endpoint**: hoje a loja vende personalização que não entrega~~ ✅ **feito (MVP) em 23/09** — `ProdutoDetalhe` lê o arquivo (≤5 MB) como data URL, o item vai em `pedido.itens` (JSONB) validado no backend e o admin **baixa pelo painel**; migrar para S3/R2 (junto com 1.3) quando o volume crescer | Funcionalidade prometida e inexistente | ~~L~~ **feito** |
| 1.5 | **Snapshot do cliente no pedido** — hoje o endereço é gravado só em `clientes` e um novo pedido **re-escreve** o endereço dos anteriores; adicionar coluna `pedido.cliente_dados JSONB` (migração idempotente no `schema.sql`) | Histórico de pedidos incorreto | S |
| 1.6 | **Reserva de estoque + expiração**: pedido `pendente` deve reservar peça e ser liberado por job após X minutos sem pagar | Evita oversell no gateway ativo (hoje só descobre na aprovação) | M |
| 1.7 | **LGPD**: consentimento na newsletter (hoje só grava e loga e-mail), política de privacidade, endpoint de exclusão de dados, `remover e-mail dos logs` | Exigência legal no Brasil | M |
| 1.8 | **Observabilidade de erro**: Sentry (backend + frontend) mantendo o pino | Ver falhas antes do cliente | S |
| 1.9 | **Testes do fluxo de pagamento com MP mockado** (injeção de `fetch` em `obterPagamento`/`criarPreferencia`) cobrindo: aprovado, valor divergente, `pending` do Pix, recusa, webhook repetido | Regressão no pagamento é dinheiro perdido | M |
| 1.10 | **Testes de frontend** (Vitest + Testing Library) no carrinho/checkout | O carrinho é o coração da loja | M |

---

## 🧱 Fase 2 — Solidez (semana 3–4, contínuo)

| # | Item | Por quê | Esforço |
|---|---|---|---|
| 2.1 | ~~**CI na raiz**: GitHub Actions rodando `lint + test + build` em cada PR~~ ✅ **feito** — `.github/workflows/ci.yml` (backend: 78 testes + audit; frontend: lint + build; docker: build da imagem) | Regressão não chega ao main | S |
| 2.2 | ~~**`npm audit`/Dependabot** no CI~~ ✅ **feito** (audit bloqueia backend; frontend informativo — 4 advisories em ferramentas de build, corrigir com `npm audit fix` no Windows). Dependabot: ativar em Settings → Security | Dependência vulnerável = brecha | S |
| 2.3 | **Rate limit em Redis** (hoje em memória) quando houver mais de 1 instância | Escala horizontal | M |
| 2.4 | ~~**Helmet** (pacote) + HSTS~~ ✅ **feito** — `helmet@8` com CSP de API, frame DENY, HSTS (ativo assim que houver HTTPS), CORP e Referrer-Policy | Profundura dos cabeçalhos | S |
| 2.5 | **Imagens em CDN** (sair do base64/TEXT) + `ETag`/cache em `/api/produtos` | Performance e custo de banco | M |
| 2.6 | **Paginação/busca/filtro** em `/api/produtos` | Catálogo cresce | M |
| 2.7 | **Fila/worker de webhooks**: responder 200 rápido e processar fora do request (evita timeout do MP em carga) | Confiabilidade do pagamento | M |
| 2.8 | **Logs sensíveis**: revisar para não logar e-mail/PAGANODE em texto (pino com redact) | LGPD | S |
| 2.9 | ~~**Docker**: Dockerfile + `docker-compose` (api + postgres)~~ ✅ **feito** — `backend/Dockerfile` (node:22-alpine, não-root, healthcheck, roda migrate na subida) + `docker-compose.yml` (`docker compose up --build`) | Onboarding e deploy | S |

---

## 🚀 Fase 3 — Crescimento (após validar vendas)

Cupons e promoções · ~~carrinho persistido~~ ✅ (localStorage) · recuperação de carrinho abandonado · avaliações e fotos de clientes · SEO (sitemap, OG, `meta description` — o `index.html` hoje não tem) · analytics (Plausible/GA4) · rastreio de envio + nota fiscal · e-mail marketing a partir da newsletter · múltiplos endereços · PWA.

---

## ✅ Definition of Done — "pronto para produção"

Checklist da chave:

- [ ] Pagamento **real** testado de ponta a ponta com credencial de produção (Pix + cartão)
- [ ] `MP_WEBHOOK_SECRET` preenchido e validação de assinatura **ativa** (testar com notificação real)
- [ ] Backend hospedado em domínio com HTTPS, `TRUST_PROXY=true`, `JWT_SECRET` novo
- [ ] Site publicado apontando para a API (`VITE_API_URL`) — verificado em produção
- [x] Dono da loja consegue **ver e atualizar pedidos** (aba Pedidos no admin, 23/09)
- [x] Cliente vê a **confirmação do pedido** ao voltar do Mercado Pago (rota `/pedido/:id`, 23/09)
- [ ] Backup automatizado + **restore testado**
- [x] Recuperação de senha funcionando (`esqueci-senha` + `redefinir-senha`, 23/09)
- [ ] LGPD básica (política, consentimento, exclusão de dados)
- [x] CI rodando lint + testes em todo PR (23/09)
- [ ] Sentry (ou equivalente) recebendo erros
- [x] Upload de personalização entregando o arquivo ao dono da loja (vai no pedido + download no painel, 23/09)

---

## ⚠️ Riscos de lançar hoje sem a Fase 0

1. **Nenhum pagamento confirmaria** sem `MP_WEBHOOK_SECRET` correto (assinatura) — ou seria aceito sem validação, dependendo da configuração.
2. **Site publicado não conversa com a API** (sem `VITE_API_URL`) e falha silenciosa no mock.
3. ~~**Dono não vê pedidos** — teria que consultar direto no banco.~~ ✅ resolvido: aba Pedidos no admin.
4. ~~**Cliente paga e não recebe confirmação visível** — suporte manual e desconfiança.~~ ✅ resolvido: rota `/pedido/:id` com status ao vivo.
5. **Sem backup/restore testado**, qualquer incidente de banco é perda total.
