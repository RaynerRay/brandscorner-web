# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and workspace configuration
COPY apps/seller-service/package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Copy workspace packages that seller-service depends on
COPY packages/libs/prisma ./packages/libs/prisma
COPY packages/libs/redis ./packages/libs/redis
COPY packages/middleware ./packages/middleware
COPY packages/error-handler ./packages/error-handler
COPY packages/utils/logs ./packages/utils/logs
COPY prisma ./prisma

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
RUN pnpm install --prod --no-frozen-lockfile

# Copy built application
COPY apps/seller-service/dist ./dist
COPY apps/seller-service/entrypoint.sh ./entrypoint.sh

# ---- Production Stage ----
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy files from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Switch to non-root user
USER nodejs

# Expose the correct port
EXPOSE 6003

# Use entrypoint script to generate Prisma client at runtime
ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]