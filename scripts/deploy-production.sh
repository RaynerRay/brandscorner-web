#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE="docker compose -f docker-compose.production.yml"
BACKENDS="auth-service,product-service,order-service,seller-service,admin-service,chatting-service,kafka-service,logger-service,recommendation-service,api-gateway"

echo "==> Stopping previous stack"
$COMPOSE down --remove-orphans || true

echo "==> Preparing pnpm 9 (matches lockfileVersion 9.0)"
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install --frozen-lockfile
npx prisma generate

echo "==> Compiling backend services (Dockerfiles copy apps/*/dist)"
npx nx run-many --target=build --projects="$BACKENDS" --parallel=3

echo "==> Building images and starting stack"
$COMPOSE up -d --build --remove-orphans

echo "==> Status"
$COMPOSE ps

echo ""
echo "Store:  https://brandscorner.co.zw"
echo "Seller: https://sellers.brandscorner.co.zw"
echo "Admin:  https://admin.brandscorner.co.zw"
echo "Health: https://brandscorner.co.zw/gateway-health"
