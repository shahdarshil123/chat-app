#  Real-Time Chat Messaging Application

A full-stack, real-time chat messaging application built to support **one-to-one conversations**, **real-time message delivery**, **message persistence**, and **scalable WebSocket communication** using modern backend and frontend technologies.

---

##  Features

- 🔹 One-to-one private conversations
- 🔹 Real-time message delivery using WebSockets
- 🔹 Message persistence with relational storage
- 🔹 Containerized development environment

---

##  Core Concepts

### 1️⃣ Users
Each user has:
- Unique user ID
- Profile metadata
- Authentication credentials

Users can participate in multiple conversations.

---

### 2️⃣ Conversations
A conversation represents a **logical chat thread** between two users.

Each conversation stores:
- Participant user IDs
- Creation timestamp
- Last message metadata

This enables:
- Fast conversation listing
- Efficient unread count calculation
- Message grouping

---

### 3️⃣ Messages
Each message is:
- Belongs to a conversation
- Sent by a user
- Stored permanently in the database
- Delivered in real-time via WebSocket

#### Message Fields
```text
id
conversation_id
sender_id
content
created_at
```

## Message Flow

The chat system follows a **persist-first, real-time-second** design to ensure reliability, ordering, and fault tolerance.

---

### 1️⃣ Sending a Message (Client)

- User types a message and clicks **Send**
- The client emits a WebSocket event to the server

```js
socket.emit("message:send", {
  conversationId,
  content
});
```

---

### 2️⃣ Message Processing (Server)

When the server receives the message:

1. Validates the sender
2. Verifies the conversation exists and the user is a participant
3. Persists the message in the database
4. Emits the message to other participants in the conversation

The database is the **single source of truth**.

---

### 3️⃣ Real-Time Delivery

- If the recipient is connected, the message is delivered instantly via WebSocket
- If the recipient is offline, the message remains stored in the database

This guarantees **no message loss**.

---

### 4️⃣ Client Update

- Sender sees the message immediately
- Receiver updates the UI in real time
- Messages are ordered using `created_at` timestamps

---

### 5️⃣ Synchronization & Recovery

On refresh or reconnect:

1. Client fetches conversation list via REST API
2. Client fetches message history for the active conversation
3. WebSocket connection resumes for live updates

This ensures:
- Correct ordering
- Consistent UI state
- Reliable recovery from network issues

---

##  Tech Stack

The application is built using a modern, production-ready stack.

---

### Frontend
- React
- Component-based UI architecture
- WebSocket client for real-time updates

---

### Backend
- Node.js
- REST APIs for conversations and messages
- WebSocket server for real-time messaging

---

### Real-Time Communication
- Socket.IO
- Event-driven messaging
- Handles reconnections and message broadcasting

---

### Database
- PostgreSQL
- Stores users, conversations, messages
- Ensures durability and consistency

---

### ORM
- Prisma
- Type-safe database access
- Schema migrations and query abstraction

---

### Containerization & DevOps
- Docker
- Docker Compose
- Local and production parity

---

## Design Principles

- Database-first messaging
- Real-time delivery as an optimization
- Stateless backend services
- Scalable and fault-tolerant architecture

##  Services Overview

| Service | Description |
|------|------------|
| `client` | Frontend application (Vite / React) |
| `server` | Backend API + Socket.IO + Prisma |
| `db` | PostgreSQL database |
| `migrate` | One-time Prisma migration runner |

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







