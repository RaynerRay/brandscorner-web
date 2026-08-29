#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE="docker compose -f docker-compose.production.yml"
BACKENDS="auth-service,product-service,order-service,seller-service,admin-service,chatting-service,kafka-service,logger-service,recommendation-service,api-gateway"

# Non-interactive SSH does not load nvm from .bashrc
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
fi
export PATH="$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node" 2>/dev/null | tail -1)/bin:/usr/local/bin:$PATH"

compile_backends() {
  echo "==> Compiling backend services (Dockerfiles copy apps/*/dist)"
  pnpm install --no-frozen-lockfile
  pnpm exec prisma generate
  npx nx run-many --target=build --projects="$BACKENDS" --parallel=3
}

echo "==> Preparing pnpm 9"
if command -v corepack >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@9.15.9 --activate
  compile_backends
else
  echo "corepack/node not on PATH; compiling inside node:20"
  docker run --rm \
    -v "$PWD":/app \
    -w /app \
    node:20-bookworm \
    bash -c '
      set -euo pipefail
      corepack enable
      corepack prepare pnpm@9.15.9 --activate
      pnpm install --no-frozen-lockfile
      pnpm exec prisma generate
      npx nx run-many --target=build --projects="'"$BACKENDS"'" --parallel=3
    '
fi

echo "==> Stopping previous stack"
$COMPOSE down --remove-orphans || true

echo "==> Building images and starting stack"
$COMPOSE up -d --build --remove-orphans

echo "==> Status"
$COMPOSE ps

echo ""
echo "Store:  https://brandscorner.co.zw"
echo "Seller: https://sellers.brandscorner.co.zw"
echo "Admin:  https://admin.brandscorner.co.zw"
echo "Health: https://brandscorner.co.zw/gateway-health"
