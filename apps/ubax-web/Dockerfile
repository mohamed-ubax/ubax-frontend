# ===================================================================
# ubax-web (admin) – Dockerfile multi-stage
# ===================================================================

# ─── Stage 1 : Build ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps

COPY . .

RUN npx nx build ubax-web --configuration=production

# ─── Stage 2 : Runtime ───────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

LABEL org.opencontainers.image.title="UBAX Web Admin Frontend"
LABEL org.opencontainers.image.vendor="Spirit Tech Revolution"

RUN rm /etc/nginx/conf.d/default.conf && \
    mkdir -p /usr/share/nginx/html/app

# Copier les fichiers buildés dans le sous-dossier /app
COPY --from=builder /app/dist/apps/ubax-web/browser /usr/share/nginx/html/app

# Copier la config Nginx
COPY apps/ubax-web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1
