# syntax=docker/dockerfile:1
# Multi-stage build: compile with all dev tools, ship only what is needed to run.
# Final image: no TypeScript, no dev dependencies, runs as a non-root user.

# ---------- base ----------
FROM node:24-alpine AS base
WORKDIR /app

# ---------- deps: all dependencies (needed to build) ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ---------- build: generate Prisma client + compile TypeScript ----------
# Also used by the `migrate` service in docker-compose (it has the Prisma CLI).
FROM deps AS build
COPY . .
RUN npx prisma generate && npm run build

# ---------- prod-deps: runtime dependencies only ----------
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ---------- runtime ----------
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

# The official Node image ships a non-root "node" user. Never run containers as root.
USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/v1/health || exit 1

# Run node directly (not via npm) so SIGTERM reaches the app and graceful shutdown works.
CMD ["node", "dist/server.js"]
