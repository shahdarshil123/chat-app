#!/bin/bash
set -e

echo "🚀 Starting containers..."
docker compose up --build -d

echo "⏳ Waiting for database to be healthy..."
until docker compose exec db pg_isready -U chat_user -d chat_app >/dev/null 2>&1; do
  sleep 2
done
echo "✅ Database is ready"

echo "⏳ Waiting for server container..."
until docker compose exec server node -e "process.exit(0)" >/dev/null 2>&1; do
  sleep 2
done
echo "✅ Server container is running"

echo "🌱 Seeding database..."
docker compose exec server npx prisma db seed

echo "🎉 Dev environment ready!"
