#!/usr/bin/env bash
set -e

# -----------------------------
# Validate input
# -----------------------------
if [ -z "$1" ]; then
  echo "❌ ERROR: Version not provided"
  echo "Usage: ./start-chat-app.sh vX.Y.Z"
  exit 1
fi

VERSION="$1"

echo "🚀 Starting Chat App Stack (version: $VERSION)"

# -----------------------------
# Config
# -----------------------------
NETWORK="chat-net"

POSTGRES_CONTAINER="postgres"
REDIS_CONTAINER="chat_redis"
SERVER_CONTAINER="chat-server"
CLIENT_CONTAINER="chat-client"

POSTGRES_USER="chat_user"
POSTGRES_PASSWORD="chat_pass"
POSTGRES_DB="chat_app"

SERVER_IMAGE="darshilshah0208/chat-app-server:${VERSION}"
CLIENT_IMAGE="darshilshah0208/chat-app-client:${VERSION}"

# -----------------------------
# Helpers
# -----------------------------
container_exists() {
  docker ps -a --format '{{.Names}}' | grep -w "$1" >/dev/null 2>&1
}

container_running() {
  docker ps --format '{{.Names}}' | grep -w "$1" >/dev/null 2>&1
}

# -----------------------------
# Pull images
# -----------------------------
echo "📥 Pulling Docker images"
docker pull "$SERVER_IMAGE"
docker pull "$CLIENT_IMAGE"

# -----------------------------
# Network
# -----------------------------
if docker network ls --format '{{.Name}}' | grep -w "$NETWORK" >/dev/null; then
  echo "✅ Network '$NETWORK' already exists"
else
  echo "🔧 Creating network '$NETWORK'"
  docker network create "$NETWORK"
fi

# -----------------------------
# PostgreSQL
# -----------------------------
if container_running "$POSTGRES_CONTAINER"; then
  echo "✅ PostgreSQL already running"
elif container_exists "$POSTGRES_CONTAINER"; then
  echo "🔄 Starting existing PostgreSQL container"
  docker start "$POSTGRES_CONTAINER"
else
  echo "🐘 Starting PostgreSQL"
  docker run -d \
    --name "$POSTGRES_CONTAINER" \
    --network "$NETWORK" \
    -e POSTGRES_USER="$POSTGRES_USER" \
    -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    -e POSTGRES_DB="$POSTGRES_DB" \
    postgres:15
fi

# -----------------------------
# Redis
# -----------------------------
if container_running "$REDIS_CONTAINER"; then
  echo "✅ Redis already running"
elif container_exists "$REDIS_CONTAINER"; then
  echo "🔄 Starting existing Redis container"
  docker start "$REDIS_CONTAINER"
else
  echo "🧠 Starting Redis"
  docker run -d \
    --name "$REDIS_CONTAINER" \
    --network "$NETWORK" \
    redis:7
fi

# -----------------------------
# Server
# -----------------------------
if container_running "$SERVER_CONTAINER"; then
  echo "⚠️ Chat server already running (version unchanged)"
elif container_exists "$SERVER_CONTAINER"; then
  echo "🔄 Restarting chat server with version $VERSION"
  docker rm -f "$SERVER_CONTAINER"
  docker run -d \
    --name "$SERVER_CONTAINER" \
    --network "$NETWORK" \
    -p 4000:4000 \
    -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}" \
    -e REDIS_URL="redis://${REDIS_CONTAINER}:6379" \
    "$SERVER_IMAGE"
else
  echo "🖥️ Starting chat server"
  docker run -d \
    --name "$SERVER_CONTAINER" \
    --network "$NETWORK" \
    -p 4000:4000 \
    -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}" \
    -e REDIS_URL="redis://${REDIS_CONTAINER}:6379" \
    "$SERVER_IMAGE"
fi

# -----------------------------
# Client
# -----------------------------
if container_running "$CLIENT_CONTAINER"; then
  echo "⚠️ Chat client already running (version unchanged)"
elif container_exists "$CLIENT_CONTAINER"; then
  echo "🔄 Restarting chat client with version $VERSION"
  docker rm -f "$CLIENT_CONTAINER"
  docker run -d \
    --name "$CLIENT_CONTAINER" \
    --network "$NETWORK" \
    -p 5173:5173 \
    -e VITE_API_URL="http://${SERVER_CONTAINER}:4000" \
    "$CLIENT_IMAGE"
else
  echo "🌐 Starting chat client"
  docker run -d \
    --name "$CLIENT_CONTAINER" \
    --network "$NETWORK" \
    -p 5173:5173 \
    -e VITE_API_URL="http://${SERVER_CONTAINER}:4000" \
    "$CLIENT_IMAGE"
fi

# -----------------------------
# Prisma
# -----------------------------
echo "📦 Running Prisma migrations"
docker exec "$SERVER_CONTAINER" npx prisma migrate deploy

echo "🌱 Seeding database"
docker exec "$SERVER_CONTAINER" npx prisma db seed

echo ""
echo "✅ Chat App Stack is up!"
echo "👉 Server: http://localhost:4000"
echo "👉 Client: http://localhost:5173"
