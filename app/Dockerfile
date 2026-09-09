# ── Base image ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
# Copy only manifests first so Docker layer-caches npm install
COPY package*.json ./

# ── Dependencies stage ──────────────────────────────────────────────────────
FROM base AS deps
RUN npm ci --only=production

# ── Build / test stage ──────────────────────────────────────────────────────
FROM base AS builder
# Install ALL deps (including devDependencies for testing)
RUN npm ci
COPY . .
# Run tests as part of the Docker build so a failing test aborts the image
RUN npm test

# ── Production image ────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only production node_modules
COPY --from=deps   /app/node_modules ./node_modules
# Copy application source
COPY --from=builder /app/src        ./src
COPY --from=builder /app/public     ./public
COPY --from=builder /app/package.json ./

USER appuser

EXPOSE 3000

# Health check so Docker / orchestrators can verify the container is alive
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
