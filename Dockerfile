# ─── Multi-Stage Production Dockerfile for SAIL MARINEX ────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy source code and build TypeScript
COPY src/ ./src/
COPY scripts/ ./scripts/
RUN npm run build

# ─── Production Runner ────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=8000

# Security: run as non-root user
USER node

# Copy package descriptors and install production-only dependencies
COPY --chown=node:node package*.json ./
RUN npm ci --only=production

# Copy compiled artifacts from builder
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

CMD ["node", "dist/index.js"]
