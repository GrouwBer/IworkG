# ── Build stage ──
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ── Runtime stage ──
FROM node:22-alpine
WORKDIR /app

# better-sqlite3 needs build tools on Alpine
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --production && npm rebuild better-sqlite3 \
    && apk del python3 make g++

COPY --from=build /app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "dist/server.js"]
