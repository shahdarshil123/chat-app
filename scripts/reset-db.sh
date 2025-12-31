#!/usr/bin/env bash

echo "⚠️  TRUNCATE-BASED DATABASE RESET"
echo "This will DELETE ALL DATA but keep schema."

read -p "Continue? (y/N): " confirm
[[ "$confirm" == "y" ]] || exit 0

echo "🧹 Truncating tables using truncate.sql..."

cat scripts/truncate.sql | docker compose exec -T db \
  psql -U chat_user -d chat_app

echo "🌱 Re-seeding database..."
docker compose exec server npx prisma db seed

echo "✅ Database reset complete."
