FROM node:20-alpine AS deps
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV CI=false
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps ./apps
COPY packages ./packages
COPY prisma ./prisma

RUN pnpm install --no-frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV CI=false
ENV NODE_ENV=production
ENV NX_DAEMON=false
ENV NX_SKIP_NX_CACHE=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SERVER_URI=https://brandscorner.co.zw
ENV NEXT_PUBLIC_SOCKET_URI=wss://brandscorner.co.zw/ws-loggers
ENV NEXT_PUBLIC_USER_UI_LINK=https://brandscorner.co.zw

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY --from=deps /app /app
COPY nx.json tsconfig.base.json ./
COPY prisma ./prisma
COPY apps/admin-ui ./apps/admin-ui

RUN npx --yes prisma@6.12.0 generate
WORKDIR /app/apps/admin-ui
RUN npm run build

FROM node:20-alpine AS production
RUN apk add --no-cache dumb-init
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./apps/admin-ui/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./apps/admin-ui/public

USER nextjs
EXPOSE 3002
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/admin-ui/server.js"]
