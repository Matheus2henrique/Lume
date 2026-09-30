/**
 * Monta a configuração do pool do PostgreSQL a partir do env validado.
 *
 * Separado de src/db.js de propósito: é uma função pura, testável sem abrir
 * conexão, e o db.js fica só com o efeito colateral de instanciar o pool.
 *
 * O que este módulo resolve em produção:
 *  • DB_SSL=true  → TLS com o banco gerenciado (Neon/Supabase/Render/RDS);
 *  • connectionTimeoutMillis → conexão que não responde não segura o worker;
 *  • idleTimeoutMillis       → devolve conexão ociosa ao provedor;
 *  • statement_timeout       → consulta travada é cancelada pelo Postgres em
 *                              vez de segurar lock de linha indefinidamente.
 */
export function montarConfigPool(env) {
  const config = {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    max: env.DB_POOL_MAX,
    connectionTimeoutMillis: env.DB_CONN_TIMEOUT_MS,
    idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
    statement_timeout: env.DB_STATEMENT_TIMEOUT_MS,
  }

  if (env.DB_SSL) {
    // rejectUnauthorized=true valida o certificado contra a lista do sistema.
    // Só desligue se o provedor emitir certificado próprio e você tiver
    // adicionado a CA (DB_SSL_REJECT_UNAUTHORIZED=false é exceção, não regra).
    config.ssl = { rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED }
  }

  return config
}
