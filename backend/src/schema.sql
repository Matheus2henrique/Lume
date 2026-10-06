-- Lume — esquema PostgreSQL
-- Execute com: npm run migrate
-- ou: psql -U SEU_USUARIO -d lume -f src/schema.sql

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  provedor TEXT NOT NULL DEFAULT 'email',
  admin BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT NOT NULL DEFAULT '',
  endereco TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  descricao TEXT NOT NULL DEFAULT '',
  imagem TEXT NOT NULL DEFAULT '',
  ordem INTEGER,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  genero TEXT NOT NULL,
  subcategoria TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'decoracao',
  preco NUMERIC(10,2) NOT NULL,
  estoque INTEGER NOT NULL DEFAULT 0,
  permite_upload BOOLEAN NOT NULL DEFAULT FALSE,
  descricao TEXT NOT NULL DEFAULT '',
  imagem TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  cliente_id INTEGER REFERENCES clientes(id),
  total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'novo',
  itens JSONB NOT NULL,
  pagamento JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, produto_id)
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_produto ON favoritos (produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_genero ON produtos (genero);

-- Migração: ordem de exibição dos nichos na loja (NULL = sem posição definida,
-- cai no fim da lista ordenando por nome). Ver seed-generos.js.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'generos' AND column_name = 'ordem'
  ) THEN
    ALTER TABLE generos ADD COLUMN ordem INTEGER;
  END IF;
END $$;

-- Migração: subpasta do produto dentro do nicho (menu mobile: nicho > subpasta
-- > produtos). Vazio = o produto não aparece em nenhuma subpasta.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'subcategoria'
  ) THEN
    ALTER TABLE produtos ADD COLUMN subcategoria TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS newsletter (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migração: adicionar coluna admin se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'admin'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN admin BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- Migração: verificação de e-mail por código
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'email_verificado'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN email_verificado BOOLEAN NOT NULL DEFAULT FALSE;
    -- Contas que já existiam antes da feature são consideradas verificadas
    -- (evita tranchar admin/usuários atuais fora da conta).
    UPDATE usuarios SET email_verificado = TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'codigo_verificacao_hash'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN codigo_verificacao_hash TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'codigo_expira_em'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN codigo_expira_em TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'codigo_tentativas'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN codigo_tentativas INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Migração: recuperação de senha por código (esqueci minha senha)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'reset_hash'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN reset_hash TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'reset_expira_em'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN reset_expira_em TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'reset_tentativas'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN reset_tentativas INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ===========================================================================
-- Produção — sessão, histórico de pedido, idempotência, LGPD e integridade
-- ===========================================================================

-- Sessão revogável: trocar a senha/sair incrementa token_version e derruba
-- todos os JWT emitidos antes (ver src/middleware/auth.js e src/routes/auth.js).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'token_version'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Snapshot do cliente no pedido: o histórico deixa de depender da tabela
-- clientes, que um novo pedido pode reescrever (ver src/routes/pedidos.js).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'cliente_dados'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN cliente_dados JSONB;
  END IF;
END $$;

-- Backfill: pedidos antigos herdam os dados conhecidos do cliente.
UPDATE pedidos p
SET cliente_dados = jsonb_build_object(
      'nome', c.nome, 'email', c.email, 'telefone', c.telefone, 'endereco', c.endereco
    )
FROM clientes c
WHERE p.cliente_id = c.id AND p.cliente_dados IS NULL;

-- Idempotência do checkout: a chave é gravada na MESMA transação do pedido,
-- então duplo clique/retry de rede devolve o pedido já criado em vez de outro.
CREATE TABLE IF NOT EXISTS dedupe (
  hash TEXT PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dedupe_criado_em ON dedupe (criado_em);

-- LGPD: consentimento explícito da newsletter.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter' AND column_name = 'aceite'
  ) THEN
    ALTER TABLE newsletter ADD COLUMN aceite BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter' AND column_name = 'aceite_em'
  ) THEN
    ALTER TABLE newsletter ADD COLUMN aceite_em TIMESTAMPTZ;
  END IF;
END $$;

-- Índices de listagem/administração.
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos (status);
CREATE INDEX IF NOT EXISTS idx_pedidos_criado_em ON pedidos (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_usuarios_email_verificado ON usuarios (email_verificado)
  WHERE email_verificado = FALSE;

-- Restrições de verificação. Regra: NUNCA alteram dado existente — se os
-- dados atuais violarem a regra, a constraint é adiada com um aviso.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_produtos_preco' AND conrelid = 'produtos'::regclass
  ) THEN
    IF EXISTS (SELECT 1 FROM produtos WHERE preco < 0) THEN
      RAISE NOTICE 'chk_produtos_preco adiada: existem precos negativos em produtos';
    ELSE
      ALTER TABLE produtos ADD CONSTRAINT chk_produtos_preco CHECK (preco >= 0);
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_produtos_estoque' AND conrelid = 'produtos'::regclass
  ) THEN
    IF EXISTS (SELECT 1 FROM produtos WHERE estoque < 0) THEN
      RAISE NOTICE 'chk_produtos_estoque adiada: existem estoques negativos (ja usados como saida)';
    ELSE
      ALTER TABLE produtos ADD CONSTRAINT chk_produtos_estoque CHECK (estoque >= 0);
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_pedidos_total' AND conrelid = 'pedidos'::regclass
  ) THEN
    IF EXISTS (SELECT 1 FROM pedidos WHERE total < 0) THEN
      RAISE NOTICE 'chk_pedidos_total adiada: existem totais negativos em pedidos';
    ELSE
      ALTER TABLE pedidos ADD CONSTRAINT chk_pedidos_total CHECK (total >= 0);
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_pedidos_status' AND conrelid = 'pedidos'::regclass
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pedidos
      WHERE status NOT IN ('novo', 'pendente', 'pago', 'enviado', 'entregue', 'cancelado')
    ) THEN
      RAISE NOTICE 'chk_pedidos_status adiada: existem status fora da lista permitida';
    ELSE
      ALTER TABLE pedidos ADD CONSTRAINT chk_pedidos_status
        CHECK (status IN ('novo', 'pendente', 'pago', 'enviado', 'entregue', 'cancelado'));
    END IF;
  END IF;
END $$;

-- ============================================================
-- Melhor Envio — Fase 1: cotação de frete (MELHOR_ENVIO.md)
--
--  • produtos: peso (kg) e dimensões (cm) que a API exige para cotar;
--  • clientes/pedidos: CEP estruturado do destinatário;
--  • pedidos.frete: opção escolhida (transportadora, valor, prazo).
--    O VALOR é recalculado no servidor no checkout — o JSON gravado é
--    prova do que foi cobrado, nunca a fonte de verdade do total.
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'peso'
  ) THEN
    ALTER TABLE produtos ADD COLUMN peso NUMERIC(7,3);      -- kg
    ALTER TABLE produtos ADD COLUMN altura NUMERIC(7,2);    -- cm
    ALTER TABLE produtos ADD COLUMN largura NUMERIC(7,2);   -- cm
    ALTER TABLE produtos ADD COLUMN comprimento NUMERIC(7,2); -- cm
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'cep'
  ) THEN
    ALTER TABLE clientes ADD COLUMN cep    TEXT NOT NULL DEFAULT '';
    ALTER TABLE clientes ADD COLUMN numero TEXT NOT NULL DEFAULT '';
    ALTER TABLE clientes ADD COLUMN bairro TEXT NOT NULL DEFAULT '';
    ALTER TABLE clientes ADD COLUMN cidade TEXT NOT NULL DEFAULT '';
    ALTER TABLE clientes ADD COLUMN uf     TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'frete'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN frete JSONB;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'rastreio'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN rastreio TEXT;
  END IF;
END $$;

-- ============================================================
-- Reserva de estoque (PLANO 1.6)
--
-- A peça sai do estoque na CRIAÇÃO do pedido (qualquer status) e só volta
-- quando ele for cancelado (webhook, admin) ou expirar sem pagamento.
-- `estoque_reservado` é a trava de idempotência: é ela que impede webhook
-- repetido ou cancelamento em dobro de devolver a peça DUAS vezes.
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pedidos' AND column_name = 'estoque_reservado'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN estoque_reservado BOOLEAN NOT NULL DEFAULT FALSE;

    -- Backfill dos pedidos que já existem: baixavam estoque (novo/pago/enviado/
    -- entregue) viram TRUE. 'pendente' antigo NÃO baixava — continua FALSE,
    -- para não devolver peça que nunca saiu.
    UPDATE pedidos
       SET estoque_reservado = TRUE
     WHERE status IN ('novo', 'pago', 'enviado', 'entregue');
  END IF;
END $$;

-- Pedidos esperando pagamento dentro do prazo (o job de expiração varre isso).
CREATE INDEX IF NOT EXISTS idx_pedidos_pendente_expirar
  ON pedidos (criado_em)
  WHERE status = 'pendente';

-- ============================================================
-- Avaliações de produto — estrelas (1–5) + texto.
-- Uma avaliação por conta por produto (o segundo POST atualiza a
-- primeira, nunca duplica). O nome exibido vem de usuarios.nome.
-- ============================================================
CREATE TABLE IF NOT EXISTS avaliacoes (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nota INTEGER NOT NULL,
  texto TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (produto_id, usuario_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_avaliacoes_nota' AND conrelid = 'avaliacoes'::regclass
  ) THEN
    IF EXISTS (SELECT 1 FROM avaliacoes WHERE nota < 1 OR nota > 5) THEN
      RAISE NOTICE 'chk_avaliacoes_nota adiada: existem notas fora de 1..5';
    ELSE
      ALTER TABLE avaliacoes ADD CONSTRAINT chk_avaliacoes_nota CHECK (nota BETWEEN 1 AND 5);
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_avaliacoes_produto ON avaliacoes (produto_id, criado_em DESC);
