# Chat Application – Common Mistakes & Lessons Learned

This document records the **mistakes, misunderstandings, and pitfalls** encountered while building a real-time chat application using **WebSockets, Prisma, PostgreSQL, and MongoDB discussions**.

The goal is to **avoid repeating these issues** in future backend, distributed systems, and event-driven projects.

---

## 1. WebSocket Connection vs Message Flow Confusion

### ❌ Mistake
Assumed that a successful socket connection automatically meant:
- rooms are joined
- messages will be delivered

### Root Cause
WebSocket connection ≠ room membership.  
`socket.join(roomId)` must be explicitly executed.

### ✅ Lesson
Always log and verify room membership:
```js
console.log(socket.rooms);
```

---

## 2. Inconsistent Field Naming (`conversationId` vs `conversationid`)

### ❌ Mistake
Used inconsistent casing across client and server.

### Impact
Messages were emitted to `undefined` rooms with no errors.

### ✅ Lesson
Use **one canonical field name** everywhere:
```
conversationId
```

---

## 3. React State Logging Misunderstanding

### ❌ Mistake
Expected state updates to be synchronous.

### Reality
React state updates are asynchronous.

### ✅ Correct Debug Pattern
```js
useEffect(() => {
  console.log(messages);
}, [messages]);
```

---

## 4. Emitting Messages Before Persistence

### ❌ Mistake
Broadcasted messages before storing them.

### Risk
Lost messages, inconsistent ordering.

### ✅ Correct Flow
1. Save message to DB  
2. Emit persisted message  
3. Render on client

---

## 5. PostgreSQL Scalability Misconception

### ❌ Mistake
Assumed PostgreSQL does not scale for chat systems.

### Reality
PostgreSQL scales well with:
- partitioning
- indexing
- append-only patterns

---

## 6. MongoDB Is Not a Silver Bullet

### ❌ Mistake
Assumed MongoDB should replace PostgreSQL entirely.

### ✅ Lesson
Hybrid storage is common:
- PostgreSQL → source of truth
- MongoDB → archive / document store
- Redis → cache / presence

---

## 7. Prisma Version (v7) Configuration Confusion

### ❌ Mistake
Used legacy datasource config.

### ✅ Lesson
Prisma 7 requires datasource config in `prisma.config.ts`.

---

## 8. Expecting Errors Where None Are Thrown

### ❌ Mistake
Expected Socket.io to throw errors for invalid emits.

### Reality
Many failures are silent.

### ✅ Lesson
Add defensive logging:
```js
socket.onAny(console.log);
```

---

## 9. Jumping to Scalability Too Early

### ❌ Mistake
Focused on MongoDB vs PostgreSQL before correctness.

### ✅ Correct Order
1. Correctness  
2. Durability  
3. Observability  
4. Performance  
5. Scalability

---

## Final Takeaway

Most issues came from **assuming behavior instead of verifying it**.

This file should be referenced before starting any new backend or real-time project.
