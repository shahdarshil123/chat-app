# 📘 Session-Based Authentication & Socket Architecture (Chat App)

## 📌 Overview
This document captures **everything implemented, fixed, and learned** while building a secure chat application using **session-based authentication**, **HTTP-only cookies**, and **Socket.IO**.

It exists so future-you does **not repeat the same mistakes** and can confidently extend or debug this system.

---

## 🧠 Core Principles (Memorize These)

> **Sessions identify users**  
> **Middleware enforces access**  
> **Sockets reuse sessions**  
> **Frontend never decides identity**

If any future change violates these rules — it is a bug.

---

## 🏗 Final Architecture

```
Browser
 ├── HTTP Requests (fetch)
 │     └── Cookie: chat.sid
 │           ↓
 │     express-session middleware
 │           ↓
 │     req.session.userId
 │
 └── Socket.IO (WebSocket)
       └── SAME cookie
             ↓
       socket.request.session.userId
```

✔ One identity source  
✔ No duplication  
✔ No client trust  
✔ No localStorage auth

---

## 🔐 Authentication Strategy

### What We Use
- Session-based authentication
- HttpOnly cookies
- Server-side authorization checks
- No JWT
- No localStorage

### Why
- Prevents token theft
- Prevents impersonation
- Allows real logout
- Enables session expiry
- Matches real-world production systems (Slack, Gmail)

---

## 🍪 Session & Cookie Configuration

```js
session({
  name: "chat.sid",
  secret: "dev-secret-key",
  resave: false,
  saveUninitialized: false,
  rolling: true, // inactivity-based timeout
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true in HTTPS prod
    maxAge: 1000 * 60 * 30 // 30 min inactivity
  }
});
```

### Key Points
- No frontend timers
- Cookie expiry removes identity
- Session expiry is lazy
- Logout is server-authoritative

---

## ⏱ Inactivity Logout (How It ACTUALLY Works)

**There is NO timer running anywhere.**

1. User logs in → cookie set
2. User active → cookie expiry refreshed
3. User idle for `maxAge`
4. Browser deletes cookie silently
5. Next request:

```js
req.session.userId === undefined
```

6. Server responds with `401`
7. Frontend reacts → logged out

> Logout is **discovered**, not pushed.

---

## 🚪 Logout Flow (Correct Implementation)

Logout **must NOT require authentication**.

```js
router.post("/logout", (req, res) => {
  const userId = req.session?.userId;

  req.session?.destroy(() => {
    res.clearCookie("chat.sid", {
      path: "/",
      sameSite: "lax",
      secure: false,
    });

    if (userId) disconnectUserSockets(userId);

    res.json({ success: true });
  });
});
```

### Why
- Works even if cookie is missing
- Works if session already expired
- Idempotent

---

## 🧱 Authorization (MOST IMPORTANT FIX)

### 🚨 Mistake Made
Assumed sessions automatically protect routes.

**They do not.**

---

### ✅ Correct Solution — `requireAuth` Middleware

```js
export function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
```

### Applied To ALL Protected Routes

```js
router.get("/", requireAuth, handler);
```

Without this → **public data leak**.

---

## 🔌 Socket.IO Integration (Session-Based)

### 🚨 Mistakes Made
- Sending `userId` from client
- Trusting socket payloads
- Separate auth systems

---

### ✅ Correct Socket Model

- Client sends **only cookies**
- Server reads session
- Identity derived server-side

```js
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});
```

```js
const userId = socket.request.session?.userId;
if (!userId) socket.disconnect(true);
```

---

## 🟢 Online Presence Tracking

```js
Map<userId, Set<socketId>>
```

- Multi-tab safe
- User offline only when last socket disconnects
- Presence ≠ authentication

---

## 🔴 Forced Socket Disconnect on Logout

```js
export function disconnectUserSockets(userId) {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;

  for (const id of sockets) {
    io.sockets.sockets.get(id)?.disconnect(true);
  }

  onlineUsers.delete(userId);
}
```

Ensures:
- Immediate offline
- Cross-tab logout
- No ghost users

---

## 🧪 Postman Testing Checklist

### Login
- `POST /auth/login`
- Cookie appears

### Auth Check
- `GET /auth/me` → 200

### Protected API
- `GET /api/conversations` → 200

### Cookie Removal Test
- Delete `chat.sid`
- Call protected API
- MUST return `401`

If it doesn’t → route is unprotected.

---

## 🚫 Common Mistakes (DO NOT REPEAT)

❌ Using localStorage for auth
❌ Trusting client userId
❌ Forgetting requireAuth
❌ Protecting logout route
❌ Expecting cookie removal to erase UI state
❌ Assuming sockets auto-expire

---

## 🧠 Mental Models Worth Remembering

- Sessions identify users
- Cookies carry identity
- Middleware enforces access
- Frontend reacts to 401
- Sockets mirror HTTP auth

---

## ✅ Final State Achieved

✔ Secure session-based auth  
✔ Correct inactivity timeout  
✔ Protected APIs  
✔ Secure sockets  
✔ Immediate logout propagation  
✔ Production-ready architecture

---

## 🔮 Future Enhancements (Optional)

- Redis session store
- HTTPS enforcement
- Role-based access
- Typing indicators
- Read receipts
- Multi-server scaling

---

📌 **This README is the source of truth.**

If future code conflicts with this document — the code is wrong.

