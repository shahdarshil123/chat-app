# 🔄 Message Flow & 🧪 Tech Stack

This document explains how messages flow through the chat application and the technologies used to build it.

---

## 🔄 Message Flow

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

## 🧪 Tech Stack

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

## 🎯 Design Principles

- Database-first messaging
- Real-time delivery as an optimization
- Stateless backend services
- Scalable and fault-tolerant architecture

---

## 📌 Summary

This design ensures:
- Reliable message delivery
- No data loss
- Clean separation of concerns
- Easy scalability for future enhancements
