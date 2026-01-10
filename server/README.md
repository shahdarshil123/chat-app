# Server Application – Backend Architecture

This directory contains the **backend (server-side)** implementation of the chat application.  
The server is designed as a **real-time, event-driven system** with clear separation between
API routing, business logic, data access, and infrastructure concerns.

---

## Table of Contents

- [Overview](#overview)
- [Core Responsibilities](#core-responsibilities)
- [Folder Structure](#folder-structure)
- [Architecture Overview](#architecture-overview)
- [Data Access Layer](#data-access-layer-srcdb)
- [Real-Time Communication](#real-time-communication)
- [Redis Usage](#redis-usage)
- [Database & Prisma](#database--prisma)
- [Middleware & Security](#middleware--security)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)

---

## Overview

The server handles:

- User authentication & session management
- Conversation and message APIs
- Real-time messaging via WebSockets
- Online/offline presence tracking
- Durable message persistence
- Cross-instance coordination using Redis

---

## Core Responsibilities

- REST APIs for application data
- WebSocket-based real-time events
- Message delivery coordination
- Presence tracking across sessions
- Stateless HTTP with shared state via Redis
- Database-backed durability via PostgreSQL

---

## Folder Structure

```text
server/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   ├── seed.js
│   └── add_constraints.sql
│
├── src/
│   ├── constants/
│   ├── db/
│   ├── events/
│   ├── middleware/
│   ├── redis/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── config.js
│   ├── index.js
│   └── sockets.js
│ 
│
├── Dockerfile
├── docker-compose.yml
├── prisma.config.ts
├── package.json
├── .env
├── .env.example
└── README.md
```

---

## Architecture Overview

The server follows a **layered architecture**:

```
Routes  →  Services  →  DB (Data Access)

```

---

## Data Access Layer (`src/db`)

There is **no repository layer by design**.

The `db/` folder:
- Centralizes all Prisma queries
- Exposes reusable data-access functions
- Prevents direct DB access from services

---

## Real-Time Communication

Socket.IO is used for:
- User connect / disconnect
- Message broadcast
- Presence updates
- Delivery acknowledgements


---

## Redis Usage

Redis stores **ephemeral, shared state**:
- Online users
- Active socket mappings
- Session coordination

This enables horizontal scaling without server-local state.

---

## Database & Prisma

- PostgreSQL for durable storage
- Prisma for schema, migrations, and type-safe queries
- All schema artifacts live under `prisma/`

---

## Middleware & Security

- Authentication middleware
- HTTP-only cookies
- Credential-aware CORS
- Input validation at API boundary

---

## Environment Configuration

```env
DATABASE_URL=postgresql://user:pass@db:5432/chat
REDIS_URL=redis://redis:6379
APP_URL= "http://localhost:4000"
CLIENT_APP_URL = "http://localhost:5173"
NODE_ENV=dev
```

---

## Local Development

```bash
npm install
docker compose up --build
npx prisma migrate deploy
npx prisma db seed
npx prisma studio
```

