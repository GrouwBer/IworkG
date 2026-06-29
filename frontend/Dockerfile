# ── Build stage ──
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY public/ ./public/
COPY src/ ./src/
COPY .env* ./

# Build with API proxy URL (nginx will proxy /api → backend)
# Using "/" prevents config.ts from falling back to localhost:3001 via || operator
ENV VITE_API_URL=/
RUN npm run build

# ── Runtime stage: nginx ──
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx config: SPA fallback + API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
