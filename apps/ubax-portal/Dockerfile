# ===================================================================
# ubax-portal – Dockerfile multi-stage
# ===================================================================
# Stage 1 : BUILD   – compile Angular avec Nx (monorepo)
# Stage 2 : RUNTIME – Nginx alpine (image minimale statique)
# ===================================================================

# ─── Stage 1 : Build ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances en premier pour le cache Docker
# (npm ci ne se relance que si package.json / package-lock.json changent)
COPY package*.json ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps

# Copier tout le monorepo
COPY . .

# Build production ubax-portal
RUN npx nx build ubax-portal --configuration=production

# ─── Stage 2 : Runtime ───────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

LABEL org.opencontainers.image.title="UBAX Portail Frontend"
LABEL org.opencontainers.image.vendor="Spirit Tech Revolution"

# Supprimer la config nginx par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Config nginx personnalisée (SPA fallback)
COPY apps/ubax-portal/nginx.conf /etc/nginx/conf.d/default.conf

# Fichiers Angular buildés (dossier browser)
COPY --from=builder /app/dist/apps/ubax-portal/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1
