FROM node:20-alpine AS builder
WORKDIR /app/backend

# libs pro Prisma no Alpine
RUN apk add --no-cache openssl libc6-compat

# copia manifests do backend
COPY backend/package*.json ./
RUN npm ci

# copia o backend inteiro (inclui prisma/)
COPY backend/ ./

# gera client e builda
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build


FROM node:20-alpine AS runner
WORKDIR /app/backend
ENV NODE_ENV=production

RUN apk add --no-cache openssl libc6-compat

COPY backend/package*.json ./
RUN npm ci --omit=dev

# traz dist e prisma
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/server.js"]
