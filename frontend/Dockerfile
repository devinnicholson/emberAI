# frontend/Dockerfile

# ── Build stage ─────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ── Runtime stage ───────────────────────────────────────
FROM nginx:alpine
COPY --from=build /app/dist/ /usr/share/nginx/html

# Optional: copy a custom nginx.conf here if you need SPA fallback
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

