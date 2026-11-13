# Multi-stage Dockerfile para o Mapa de Alocação de Programadores
# Requer Node 22+ devido ao suporte nativo a SQLite (node:sqlite)
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Imagem de Execução (Produção)
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./
RUN npm ci --omit=dev

# Copia o frontend compilado e os arquivos do servidor
COPY --from=builder /app/dist ./dist
COPY server ./server

# Cria a pasta de dados para persistência do SQLite
RUN mkdir -p /app/server/data && chown -R node:node /app

USER node

EXPOSE 3001

VOLUME ["/app/server/data"]

CMD ["node", "server/index.js"]

