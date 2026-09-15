-- Locus — esquema PostgreSQL
-- Execute com: npm run migrate
-- ou: psql -U SEU_USUARIO -d locus -f src/schema.sql

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  provedor TEXT NOT NULL DEFAULT 'email',
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

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  genero TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS assinaturas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plano_id INTEGER NOT NULL,
  nome_plano TEXT NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  mundos JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativa',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_produto ON favoritos (produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_genero ON produtos (genero);
