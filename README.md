# Real-Time Chat Messaging Application

A full-stack, real-time chat application designed with **reliability, offline support, and scalability** in mind.  
This document includes a **navigable table of contents** for easier understanding of the architecture and implementation.

---

## 📚 Table of Contents

1. [Overview](#overview)  
2. [Features](#features)  
3. [Architecture Overview](#architecture-overview)  
4. [Core Domain Concepts](#core-domain-concepts)  
   - [Users](#users)  
   - [Conversations](#conversations)  
   - [Messages](#messages)  
5. [Message Flow](#message-flow)  
6. [Redis Integration](#redis-integration)  
   - [Session Management](#session-management)  
   - [Online User Tracking](#online-user-tracking)  
7. [Offline Messaging with IndexedDB](#offline-messaging-with-indexeddb)  
8. [Message Ordering & Reliability](#message-ordering--reliability)  
9. [Reconnection & Recovery](#reconnection--recovery)  
10. [Technology Stack](#technology-stack)  
11. [Docker & Development Workflow](#docker--development-workflow)  
12. [Core Docker Compose Commands](#core-docker-compose-commands)
---

## Overview

This chat system supports **one-to-one conversations**, **real-time updates**, **offline-first messaging**, and **session persistence across server restarts**.  


---

## Features

- One-to-one private conversations  
- Real-time message delivery via Socket.IO  
- PostgreSQL-backed message persistence  
- Redis-backed session management  
- Online/offline user presence tracking  
- IndexedDB-based offline message outbox  
- Guaranteed message ordering  
- Optimistic UI updates  

---

## Architecture Overview

```
Client (React)
  ├─ IndexedDB (offline outbox)
  ├─ Optimistic UI state
  └─ Socket.IO client

Server (Node.js / Express)
  ├─ REST APIs
  ├─ Socket.IO server
  ├─ Redis (sessions + presence)
  └─ PostgreSQL (messages)

Redis
  ├─ Session storage
  └─ Online user tracking
```

---

## Core Domain Concepts

### Users

- Identified by unique user IDs  
- Authentication handled via Express sessions  
- Sessions stored in Redis for durability  
- Supports multiple sockets per user  

---

### Conversations

A conversation represents a logical chat thread between two users.

Stored metadata:
- Participant user IDs  
- Creation timestamp  
- Last message preview  

---

### Messages

Messages are immutable records stored in PostgreSQL.

Fields:
```
id
conversation_id
sender_id
content
created_at
```

The database is the **single source of truth**.

---

## Message Flow

1. User sends a message (optimistic UI update)  
2. Message is persisted to PostgreSQL  
3. Server checks Redis for recipient sockets  
4. Message delivered via Socket.IO if online  
5. Message recovered via HTTP if offline  

---

## Redis Integration

Redis acts as an **in-memory coordination layer**, not a primary datastore.

### Session Management

- Sessions stored using `connect-redis`
- Session cookie maps to Redis key `sess:<sessionId>`
- Sessions survive server restarts

### Online User Tracking

Redis key design:
```
online:user:{userId} → Set(socketIds)
```

- Socket connect → add socketId  
- Socket disconnect → remove socketId  
- Empty set → user offline  

---

## Offline Messaging with IndexedDB

IndexedDB is used as a **client-side outbox**.

Schema:
```
outbox:
  - id
  - conversationId
  - content
  - createdAt
```

Behavior:
- Failed send → stored locally  
- UI shows pending state  
- Messages flushed in order on reconnect  

---

## Message Ordering & Reliability

- All message sends go through a serialized send queue  
- Prevents race conditions and reordering  
- Offline messages are replayed before new messages  

---

## Reconnection & Recovery

On reconnect:
1. Socket reconnects  
2. Offline outbox is flushed  
3. Active conversation messages are reloaded via HTTP  
4. UI state is rehydrated  

Sockets deliver **real-time deltas**; HTTP restores **truth**.

---

## Technology Stack

### Frontend
- React (Vite)
- IndexedDB
- Socket.IO client

### Backend
- Node.js
- Express
- Socket.IO

### Data Layer
- PostgreSQL
- Prisma ORM
- Redis

---

## Docker & Development Workflow

Services:
- `client` – React frontend  
- `server` – API + Socket.IO  
- `db` – PostgreSQL  
- `redis` – Sessions & presence  

Common commands:
```bash
docker compose up --build
docker compose exec server npx prisma migrate deploy
docker compose exec server npx prisma db seed
docker compose exec server npx prisma studio --port 5555
docker compose down -v
```

---

##  Core Docker Compose Commands

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

### Stop services and remove volumes ( destructive)
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

##  Bash Scripts (Recommended Workflow)

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

 **Deletes all data but keeps schema**



## Common Dev Flows

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