# syntax=docker/dockerfile:1
# ---------------------------------------------------------------
# Imagem do backend Lume (API Express + scripts de migrate/seed)
# Build:  docker build -t lume-backend ./backend
# ---------------------------------------------------------------

# 1) Dependências de produção, sem devDependencies (jest, supertest)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 2) Imagem final, mínima e com usuário sem privilégios
FROM node:22-alpine
RUN addgroup -S lume && adduser -S lume -G lume

WORKDIR /app
# Seguro por padrão: em produção valem as travas de env.js
# (JWT_SECRET forte, CORS sem localhost, senha de banco forte).
# O docker-compose.yml local sobrescreve para development.
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
# .env NÃO entra na imagem: as variáveis vêm do ambiente (compose/plataforma)
COPY src ./src

USER lume
EXPOSE 4000

# O /api/health já checa o banco e devolve 503 se estiver ruim.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:4000/api/health || exit 1

# Aplica o schema (idempotente) e só então sobe a API.
CMD ["sh", "-c", "npm run migrate && exec node src/server.js"]
