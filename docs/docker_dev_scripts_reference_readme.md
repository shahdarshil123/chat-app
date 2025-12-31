# Chat App – Docker & Dev Scripts Reference

This README is a **quick reference** for all Docker Compose commands and Bash scripts used in this project. It is meant to help you (or future you 👋) quickly understand **how to start, reset, debug, and inspect** the system.

---

## 📦 Services Overview

| Service | Description |
|------|------------|
| `client` | Frontend application (Vite / React) |
| `server` | Backend API + Socket.IO + Prisma |
| `db` | PostgreSQL database |
| `migrate` | One-time Prisma migration runner |

---

## 🚀 Core Docker Compose Commands

### Start all services
```bash
docker compose up -d
```
Starts client, server, database, and runs migrations automatically (via dependencies).

---

### Build images and start services
```bash
docker compose up --build -d
```
Use this after:
- dependency changes
- Dockerfile changes
- switching branches

---

### Stop all services
```bash
docker compose down
```
Stops containers but **keeps database data**.

---

### Stop services and remove volumes (⚠️ destructive)
```bash
docker compose down -v
```
Deletes **all volumes**, including Postgres data.
Use only if you want a completely fresh environment.

---

### View container status
```bash
docker compose ps
```

---

### View logs
```bash
docker compose logs -f
```

---

## 🧰 Bash Scripts (Recommended Workflow)

All scripts live in the `scripts/` directory.

> **On Windows (Git Bash):** always run scripts using
```bash
bash scripts/<script-name>.sh
```

---

### 1️⃣ `dev.sh` – Start dev environment
```bash
bash scripts/dev.sh
```

What it does:
- Starts all Docker services
- Prepares the app for local development

Use when:
- starting work for the day
- after a clean pull

---

### 2️⃣ `reset-db.sh` – Reset database (TRUNCATE-based)
```bash
bash scripts/reset-db.sh
```

What it does:
- Truncates all application tables
- Resets IDs
- Re-runs Prisma seed

Why this exists:
- Windows-safe
- No Docker volume issues
- Deterministic (no duplicate data)

⚠️ **Deletes all data but keeps schema**

---

### 3️⃣ `seed.sh` – Re-run seed only
```bash
bash scripts/seed.sh
```

Use when:
- you changed seed logic
- you want test data again without truncating

---

### 4️⃣ `logs.sh` – Follow logs
```bash
bash scripts/logs.sh
```

---

### 5️⃣ `down.sh` – Stop everything
```bash
bash scripts/down.sh
```

---

## 🗄️ Database & Debug Scripts

### Open Postgres shell
```bash
bash scripts/psql.sh
```

Equivalent to:
```bash
docker compose exec db psql -U chat_user -d chat_app
```

---

### Open Prisma Studio
```bash
bash scripts/studio.sh
```

Equivalent to:
```bash
docker compose exec server npx prisma studio --port 5555
```

Access at:
```
http://localhost:5555
```

> Prisma Studio is **manual only** (not auto-started).

---

### Shell into server container
```bash
bash scripts/shell-server.sh
```

---

## 🧪 Common Dev Flows

### Fresh start (recommended)
```bash
bash scripts/dev.sh
bash scripts/reset-db.sh
```

---

### Database-only reset
```bash
bash scripts/reset-db.sh
```

---

### Inspect DB state
```bash
bash scripts/psql.sh
```

---

## 🧠 Important Notes

- **Migrations ≠ Data**
  - Migrations create tables
  - Seed inserts rows

- **Do NOT rely on Docker volume deletion on Windows**
  - Use TRUNCATE-based reset instead

- **Interactive tools (Prisma Studio)** should never be auto-run in scripts

---

## ✅ Best Practices

- Use scripts instead of raw Docker commands
- Always verify DB state after resets
- Keep seed scripts idempotent
- Prefer TRUNCATE over volume deletion for local dev

---

## 📌 TL;DR

```bash
bash scripts/dev.sh        # start everything
bash scripts/reset-db.sh  # reset DB safely
bash scripts/seed.sh      # reseed
bash scripts/logs.sh      # logs
bash scripts/psql.sh      # DB shell
```

---

**Keep this file bookmarked.** It will save you hours later. 🚀

