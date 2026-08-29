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
ENV NEXT_PUBLIC_SERVER_URI=https://sellers.brandscorner.co.zw
ENV NEXT_PUBLIC_CHATTING_WEBSOCKET_URI=wss://sellers.brandscorner.co.zw/ws-chatting
ENV NEXT_PUBLIC_USER_UI_LINK=https://brandscorner.co.zw

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY --from=deps /app /app
COPY nx.json tsconfig.base.json ./
COPY prisma ./prisma
COPY apps/seller-ui ./apps/seller-ui

RUN npx --yes prisma@6.12.0 generate
WORKDIR /app/apps/seller-ui
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/apps/seller-ui/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/seller-ui/.next/static ./apps/seller-ui/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/seller-ui/public ./apps/seller-ui/public

USER nextjs
EXPOSE 3001
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/seller-ui/server.js"]
