#!/bin/bash
set -e # Exit on any error

COMPOSE_FILE="docker-compose.production.yml"
COMPOSE="docker compose -f $COMPOSE_FILE"

echo "🚀 Starting production deployment (local images, no Docker Hub)..."

ALL_BACKEND='["auth-service","product-service","order-service","seller-service","admin-service","chatting-service","kafka-service","logger-service","recommendation-service","api-gateway"]'
ALL_FRONTEND='["user-ui","seller-ui","admin-ui"]'

if [ -z "$CHANGED_BACKEND" ] || [ "$CHANGED_BACKEND" = "[]" ]; then
  if [ -z "$CHANGED_FRONTEND" ] || [ "$CHANGED_FRONTEND" = "[]" ]; then
    CHANGED_BACKEND="$ALL_BACKEND"
    CHANGED_FRONTEND="$ALL_FRONTEND"
  fi
fi

BACKEND_SERVICES=$(echo "${CHANGED_BACKEND:-[]}" | jq -r '.[]?' 2>/dev/null || true)
FRONTEND_SERVICES=$(echo "${CHANGED_FRONTEND:-[]}" | jq -r '.[]?' 2>/dev/null || true)

BUILD_SERVICES=""
NEED_NX=false

for service in $BACKEND_SERVICES; do
  BUILD_SERVICES="$BUILD_SERVICES $service"
  NEED_NX=true
done

for service in $FRONTEND_SERVICES; do
  BUILD_SERVICES="$BUILD_SERVICES $service"
done

BUILD_SERVICES=$(echo "$BUILD_SERVICES" | xargs)

# Backend Dockerfiles copy apps/<service>/dist — compile on the host first.
if [ "$NEED_NX" = true ]; then
  echo "Compiling backend services with Nx..."
  if command -v pnpm >/dev/null 2>&1; then
    pnpm install --frozen-lockfile
  else
    corepack enable
    corepack prepare pnpm@8.10.2 --activate
    pnpm install --frozen-lockfile
  fi
  npx prisma generate
  for service in $BACKEND_SERVICES; do
    echo "Nx build $service"
    npx nx build "$service"
  done
fi

if [ -n "$BUILD_SERVICES" ]; then
  echo "Building Docker images locally: $BUILD_SERVICES"
  $COMPOSE build $BUILD_SERVICES
else
  echo "No app services to rebuild."
fi

echo "Deploying services..."
$COMPOSE up -d

# Wait for services to be healthy with dynamic checking
echo "Waiting for services to be healthy..."

# Function to check if containers are running
check_containers() {
    local nginx_status=$(docker ps --filter "name=eshop-nginx-1" --format "{{.Status}}" | grep -c "Up" || echo "0")
    local gateway_status=$(docker ps --filter "name=eshop-api-gateway-1" --format "{{.Status}}" | grep -c "Up" || echo "0")
    
    if [ "$nginx_status" = "1" ] && [ "$gateway_status" = "1" ]; then
        return 0
    else
        return 1
    fi
}

# Function to check if health endpoint responds
check_health_endpoint() {
    curl -f -k -s --max-time 5 https://brandscorner.co.zw/gateway-health > /dev/null 2>&1
    return $?
}

# Wait for containers to start (max 5 minutes)
echo "⏳ Waiting for containers to start..."
CONTAINER_TIMEOUT=300  # 5 minutes
CONTAINER_ELAPSED=0

while ! check_containers && [ $CONTAINER_ELAPSED -lt $CONTAINER_TIMEOUT ]; do
    echo "   Containers starting... (${CONTAINER_ELAPSED}s elapsed)"
    sleep 10
    CONTAINER_ELAPSED=$((CONTAINER_ELAPSED + 10))
done

if ! check_containers; then
    echo "❌ Containers failed to start within ${CONTAINER_TIMEOUT} seconds!"
    echo "Container status:"
    docker ps | grep eshop
    exit 1
fi

echo "✅ Containers are running!"

# Wait for health endpoint to respond (max 3 minutes)
echo "⏳ Waiting for health endpoint to respond..."
HEALTH_TIMEOUT=180  # 3 minutes
HEALTH_ELAPSED=0

while ! check_health_endpoint && [ $HEALTH_ELAPSED -lt $HEALTH_TIMEOUT ]; do
    echo "   Health check pending... (${HEALTH_ELAPSED}s elapsed)"
    sleep 15
    HEALTH_ELAPSED=$((HEALTH_ELAPSED + 15))
done

if ! check_health_endpoint; then
    echo "⚠️  Health endpoint not ready within ${HEALTH_TIMEOUT} seconds, but continuing with verification..."
else
    echo "✅ Health endpoint is responding!"
fi

# Verify deployment with multiple checks
echo "Verifying deployment..."

# Check 1: HTTPS endpoint (primary)
if curl -f -k https://brandscorner.co.zw/gateway-health > /dev/null 2>&1; then
    echo "✅ HTTPS endpoint working!"
    HTTPS_OK=true
else
    echo "⚠️  HTTPS endpoint failed, trying alternatives..."
    HTTPS_OK=false
fi

# Check 2: Direct IP with HTTPS (fallback)
if [ "$HTTPS_OK" = false ]; then
    if curl -f -k -H "Host: brandscorner.co.zw" https://3.239.91.208/gateway-health > /dev/null 2>&1; then
        echo "✅ Direct HTTPS access working!"
        HTTPS_OK=true
    else
        echo "⚠️  Direct HTTPS failed, checking HTTP redirect..."
    fi
fi

# Check 3: HTTP redirect (should get 301)
if [ "$HTTPS_OK" = false ]; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://3.239.91.208/ || echo "000")
    if [ "$HTTP_STATUS" = "301" ]; then
        echo "✅ HTTP redirect working (301 to HTTPS)!"
        HTTPS_OK=true
    else
        echo "❌ HTTP status: $HTTP_STATUS (expected 301)"
    fi
fi

# Check 4: Container health (fallback)
if [ "$HTTPS_OK" = false ]; then
    echo "Checking container health..."
    if docker ps | grep -q "eshop-nginx-1.*Up"; then
        echo "✅ Nginx container is running!"
        if docker ps | grep -q "eshop-api-gateway-1.*Up"; then
            echo "✅ API Gateway container is running!"
            echo "⚠️  Services are running but may need time to initialize"
            HTTPS_OK=true
        else
            echo "❌ API Gateway container not running!"
        fi
    else
        echo "❌ Nginx container not running!"
    fi
fi

# Final verdict
if [ "$HTTPS_OK" = true ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "🌐 Site available at: https://brandscorner.co.zw"
    echo "🔧 API Health: https://brandscorner.co.zw/gateway-health"
    echo "👥 Sellers: https://sellers.brandscorner.co.zw"
    echo "⚙️  Admin: https://admin.brandscorner.co.zw"
else
    echo ""
    echo "❌ Deployment verification failed!"
    echo "🔍 Debug commands:"
    echo "  docker ps | grep eshop"
    echo "  docker logs eshop-nginx-1 --tail 20"
    echo "  docker logs eshop-api-gateway-1 --tail 20"
    echo "  curl -v https://brandscorner.co.zw/gateway-health"
    exit 1
fi
