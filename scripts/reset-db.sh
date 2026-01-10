#!/usr/bin/env bash
set -e

echo "⚠️  TRUNCATE-BASED DATABASE RESET"
echo "This will DELETE ALL DATA but keep schema."

read -p "Continue? (y/N): " confirm
[[ "$confirm" == "y" ]] || exit 0

echo "🧹 Truncating tables..."
cat scripts/truncate.sql | docker compose exec -T db \
  psql -U chat_user -d chat_app

echo "📦 Re-running migrations (safe)..."
docker compose run --rm migrate

echo "🌱 Database re-seeded successfully"

echo "✅ Database reset complete."
