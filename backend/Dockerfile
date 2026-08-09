# Taza Backend — Dockerfile

FROM node:20-alpine

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./

RUN npm ci --omit=dev

# Copy source
COPY src/ ./src/

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
