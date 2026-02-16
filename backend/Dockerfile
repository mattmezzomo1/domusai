FROM node:20-alpine
WORKDIR /app/backend

RUN apk add --no-cache openssl libc6-compat

# deps
COPY backend/package*.json ./
RUN npm install

# código
COPY backend/ ./

RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", "dist/server.js"]
