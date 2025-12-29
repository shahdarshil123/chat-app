# Chat Application - Complete REST API

## All API endpoints for users, authentication, conversations, and messages

---

## 📋 Table of Contents

1. [API Overview](#api-overview)
2. [Project Structure](#project-structure)
3. [Installation](#installation)
4. [Database Helpers](#database-helpers)
5. [Authentication](#authentication)
6. [API Routes](#api-routes)
7. [Testing](#testing)
8. [Integration with Socket.IO](#integration-with-socketio)

---

## API Overview

### Available Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

#### Users
- `GET /api/users` - Search users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `PUT /api/users/:id/status` - Update online status

#### Conversations
- `GET /api/conversations` - Get user's conversations
- `POST /api/conversations` - Create/get 1-on-1 conversation
- `POST /api/conversations/group` - Create group conversation
- `GET /api/conversations/:id` - Get conversation details
- `GET /api/conversations/:id/members` - Get conversation members

#### Messages
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message
- `PUT /api/messages/:id` - Edit message (future)
- `DELETE /api/messages/:id` - Delete message (future)
- `POST /api/conversations/:id/read` - Mark as read

---

## Project Structure

```
server/
├── src/
│   ├── db/
│   │   ├── prisma.js          ← Database connection
│   │   ├── users.js           ← User operations
│   │   ├── conversations.js   ← Conversation operations
│   │   └── messages.js        ← Message operations
│   │
│   ├── middleware/
│   │   └── auth.js            ← JWT authentication
│   │
│   ├── routes/
│   │   ├── auth.js            ← Auth endpoints
│   │   ├── users.js           ← User endpoints
│   │   ├── conversations.js   ← Conversation endpoints
│   │   └── messages.js        ← Message endpoints
│   │
│   ├── utils/
│   │   └── jwt.js             ← JWT helpers
│   │
│   ├── index.js               ← Main Express server
│   └── sockets.js             ← Socket.IO handlers
│
├── prisma/
│   ├── schema.prisma
│   └── seed.js
│
├── .env
└── package.json
```

---

## Installation

### Install Required Dependencies

```bash
cd server

npm install bcrypt jsonwebtoken
npm install @prisma/adapter-pg pg
```

**Updated package.json dependencies:**
```json
{
  "dependencies": {
    "@prisma/client": "^7.2.0",
    "@prisma/adapter-pg": "^7.2.0",
    "pg": "^8.11.3",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.2.1",
    "socket.io": "^4.8.3"
  }
}
```

---

## Database Helpers

### File: `src/db/prisma.js`

```javascript
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Create adapter
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// Singleton pattern
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

---

### File: `src/db/users.js`

```javascript
import prisma from './prisma.js';
import bcrypt from 'bcrypt';

// Create user
export async function createUser(data) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  
  return await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      passwordHash,
      displayName: data.displayName || data.username,
    },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      status: true,
      createdAt: true,
    },
  });
}

// Get user by email (for login)
export async function getUserByEmail(email) {
  return await prisma.user.findUnique({
    where: { email },
  });
}

// Get user by ID
export async function getUserById(id) {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      status: true,
      lastSeen: true,
      createdAt: true,
    },
  });
}

// Update user
export async function updateUser(id, data) {
  return await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      status: true,
    },
  });
}

// Update user status
export async function updateUserStatus(userId, status) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      status,
      lastSeen: new Date(),
    },
  });
}

// Search users
export async function searchUsers(query, limit = 10) {
  return await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      status: true,
    },
    take: limit,
  });
}

// Verify password
export async function verifyPassword(user, password) {
  return await bcrypt.compare(password, user.passwordHash);
}
```

---

### File: `src/db/conversations.js`

```javascript
import prisma from './prisma.js';

// Get or create 1-on-1 conversation
export async function getOrCreateDirectConversation(user1Id, user2Id) {
  // Find existing conversation
  const existing = await prisma.conversationMember.findFirst({
    where: {
      userId: user1Id,
      conversation: {
        isGroup: false,
        members: {
          some: {
            userId: user2Id,
          },
        },
      },
    },
    include: {
      conversation: true,
    },
  });
  
  if (existing) {
    return existing.conversation;
  }
  
  // Create new conversation
  return await prisma.conversation.create({
    data: {
      isGroup: false,
      createdBy: user1Id,
      members: {
        create: [
          { userId: user1Id, role: 'member' },
          { userId: user2Id, role: 'member' },
        ],
      },
    },
  });
}

// Get user's conversations
export async function getUserConversations(userId) {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          members: {
            where: {
              userId: { not: userId },
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  status: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: [
              { createdAt: 'desc' },
              { id: 'desc' },
            ],
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      conversation: {
        updatedAt: 'desc',
      },
    },
  });
  
  // Calculate unread counts
  const conversationsWithUnread = await Promise.all(
    memberships.map(async (m) => {
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: m.conversationId,
          createdAt: {
            gt: m.lastReadAt,
          },
          senderId: {
            not: userId,
          },
        },
      });
      
      return {
        ...m.conversation,
        unreadCount,
        lastReadAt: m.lastReadAt,
      };
    })
  );
  
  return conversationsWithUnread;
}

// Get conversation by ID
export async function getConversationById(conversationId) {
  return await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              status: true,
            },
          },
        },
      },
    },
  });
}

// Create group conversation
export async function createGroupConversation(name, creatorId, memberIds) {
  return await prisma.conversation.create({
    data: {
      isGroup: true,
      name,
      createdBy: creatorId,
      members: {
        create: [
          { userId: creatorId, role: 'admin' },
          ...memberIds.filter(id => id !== creatorId).map(id => ({
            userId: id,
            role: 'member',
          })),
        ],
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });
}

// Check if user is in conversation
export async function isUserInConversation(userId, conversationId) {
  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
  });
  
  return !!member;
}
```

---

### File: `src/db/messages.js`

```javascript
import prisma from './prisma.js';

// Send message
export async function saveMessage(data) {
  return await prisma.message.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: data.content,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });
}

// Get messages with pagination
export async function getMessages(conversationId, limit = 50, cursor) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    take: limit + 1, // Get one extra to check if there's more
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    orderBy: [
      { createdAt: 'desc' },
      { id: 'desc' },
    ],
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });
  
  const hasMore = messages.length > limit;
  const messagesWithoutExtra = hasMore ? messages.slice(0, -1) : messages;
  
  return {
    messages: messagesWithoutExtra.reverse(), // Reverse for chronological order
    hasMore,
    nextCursor: hasMore ? messagesWithoutExtra[messagesWithoutExtra.length - 1].id : null,
  };
}

// Mark conversation as read
export async function markConversationAsRead(conversationId, userId) {
  return await prisma.conversationMember.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
    data: {
      lastReadAt: new Date(),
    },
  });
}

// Get unread count for user
export async function getUnreadCount(userId) {
  const result = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM messages m
    JOIN conversation_members cm 
      ON m.conversation_id = cm.conversation_id
    WHERE cm.user_id = ${userId}
      AND m.created_at > cm.last_read_at
      AND m.sender_id != ${userId}
  `;
  
  return Number(result[0].count);
}
```

---

## Authentication

### File: `src/utils/jwt.js`

```javascript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id,
      username: user.username,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
```

---

### File: `src/middleware/auth.js`

```javascript
import { verifyToken } from '../utils/jwt.js';
import { getUserById } from '../db/users.js';

export async function authenticate(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Get user from database
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// Optional auth (doesn't fail if no token)
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      if (decoded) {
        const user = await getUserById(decoded.userId);
        if (user) {
          req.user = user;
          req.userId = user.id;
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue even if auth fails
    next();
  }
}
```

---

## API Routes

### File: `src/routes/auth.js`

```javascript
import express from 'express';
import { createUser, getUserByEmail, verifyPassword, updateUserStatus } from '../db/users.js';
import { generateToken } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email, and password are required' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }
    
    // Create user
    const user = await createUser({
      username,
      email,
      password,
      displayName,
    });
    
    // Generate token
    const token = generateToken(user);
    
    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Username or email already exists' 
      });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }
    
    // Get user
    const user = await getUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const valid = await verifyPassword(user, password);
    
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update status to online
    await updateUserStatus(user.id, 'online');
    
    // Generate token
    const token = generateToken(user);
    
    // Remove password hash from response
    delete user.passwordHash;
    
    res.json({
      user,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout user
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Update status to offline
    await updateUserStatus(req.userId, 'offline');
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
```

---

### File: `src/routes/users.js`

```javascript
import express from 'express';
import { getUserById, searchUsers, updateUser, updateUserStatus } from '../db/users.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Search users
router.get('/', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const users = await searchUsers(q);
    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user profile
router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is updating their own profile
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Can only update own profile' });
    }
    
    const { displayName, avatarUrl } = req.body;
    
    const user = await updateUser(userId, {
      ...(displayName && { displayName }),
      ...(avatarUrl && { avatarUrl }),
    });
    
    res.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Update user status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is updating their own status
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Can only update own status' });
    }
    
    const { status } = req.body;
    
    if (!['online', 'offline', 'away'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const user = await updateUserStatus(userId, status);
    
    res.json({ user });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
```

---

### File: `src/routes/conversations.js`

```javascript
import express from 'express';
import { 
  getUserConversations, 
  getOrCreateDirectConversation,
  createGroupConversation,
  getConversationById,
  isUserInConversation,
} from '../db/conversations.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user's conversations
router.get('/', authenticate, async (req, res) => {
  try {
    const conversations = await getUserConversations(req.userId);
    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Create or get 1-on-1 conversation
router.post('/', authenticate, async (req, res) => {
  try {
    const { otherUserId } = req.body;
    
    if (!otherUserId) {
      return res.status(400).json({ error: 'otherUserId is required' });
    }
    
    const conversation = await getOrCreateDirectConversation(
      req.userId,
      parseInt(otherUserId)
    );
    
    res.json({ conversation });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Create group conversation
router.post('/group', authenticate, async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    
    if (!name || !memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({ 
        error: 'name and memberIds array are required' 
      });
    }
    
    if (memberIds.length < 2) {
      return res.status(400).json({ 
        error: 'Group must have at least 2 members' 
      });
    }
    
    // Add creator to member list if not already there
    const allMemberIds = memberIds.includes(req.userId) 
      ? memberIds 
      : [req.userId, ...memberIds];
    
    const conversation = await createGroupConversation(
      name,
      req.userId,
      allMemberIds
    );
    
    res.status(201).json({ conversation });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get conversation details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    
    // Check if user is in conversation
    const isMember = await isUserInConversation(req.userId, conversationId);
    
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this conversation' });
    }
    
    const conversation = await getConversationById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json({ conversation });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

// Get conversation members
router.get('/:id/members', authenticate, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    
    // Check if user is in conversation
    const isMember = await isUserInConversation(req.userId, conversationId);
    
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this conversation' });
    }
    
    const conversation = await getConversationById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json({ members: conversation.members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to get members' });
  }
});

export default router;
```

---

### File: `src/routes/messages.js`

```javascript
import express from 'express';
import { getMessages, saveMessage, markConversationAsRead, getUnreadCount } from '../db/messages.js';
import { isUserInConversation } from '../db/conversations.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get messages in conversation
router.get('/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const limit = parseInt(req.query.limit) || 50;
    const cursor = req.query.cursor ? parseInt(req.query.cursor) : undefined;
    
    // Check if user is in conversation
    const isMember = await isUserInConversation(req.userId, conversationId);
    
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this conversation' });
    }
    
    const result = await getMessages(conversationId, limit, cursor);
    
    res.json(result);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send message
router.post('/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    // Check if user is in conversation
    const isMember = await isUserInConversation(req.userId, conversationId);
    
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this conversation' });
    }
    
    const message = await saveMessage({
      conversationId,
      senderId: req.userId,
      content,
    });
    
    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark conversation as read
router.post('/:conversationId/read', authenticate, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    
    // Check if user is in conversation
    const isMember = await isUserInConversation(req.userId, conversationId);
    
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this conversation' });
    }
    
    await markConversationAsRead(conversationId, req.userId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Get unread count
router.get('/unread/count', authenticate, async (req, res) => {
  try {
    const count = await getUnreadCount(req.userId);
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

export default router;
```

---

## Main Server

### File: `src/index.js` (Updated)

```javascript
import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { registerSockets } from "./sockets.js";

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import conversationRoutes from "./routes/conversations.js";
import messageRoutes from "./routes/messages.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/conversations', messageRoutes); // Messages are under conversations

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Chat API server running" });
});

// Serve HTML client (optional)
app.get("/chat", (req, res) => {
  res.sendFile(process.cwd() + "/src/index.html");
});

// Create HTTP server
const server = http.createServer(app);

// Register Socket.IO
registerSockets(server);

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`💬 Socket.IO ready for connections`);
});
```

---

## Testing

### Test with cURL or Postman

#### 1. Register User

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"password123\",\"displayName\":\"Test User\"}"
```

**Response:**
```json
{
  "user": {
    "id": 6,
    "username": "testuser",
    "email": "test@example.com",
    "displayName": "Test User",
    "status": "offline"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"alice@example.com\",\"password\":\"password123\"}"
```

**Response:**
```json
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Copy the token** for authenticated requests!

#### 3. Get Conversations (Protected)

```bash
curl http://localhost:4000/api/conversations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 4. Create Conversation

```bash
curl -X POST http://localhost:4000/api/conversations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"otherUserId\":2}"
```

#### 5. Send Message

```bash
curl -X POST http://localhost:4000/api/conversations/1/messages \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"Hello from API!\"}"
```

#### 6. Get Messages

```bash
curl http://localhost:4000/api/conversations/1/messages \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Integration with Socket.IO

### Updated `src/sockets.js`

```javascript
import { Server } from "socket.io";
import { saveMessage, getMessages, markConversationAsRead } from './db/messages.js';
import { isUserInConversation } from './db/conversations.js';
import { verifyToken } from './utils/jwt.js';

export function registerSockets(server) {
  console.log("Socket server initialized");
  
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      const decoded = verifyToken(token);
      
      if (!decoded) {
        return next(new Error('Invalid token'));
      }
      
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on("connection", (socket) => {
    console.log("connected:", socket.id, "User:", socket.username);

    // Join conversation room
    socket.on("conversation:join", async (conversationId) => {
      try {
        const convId = parseInt(conversationId);
        
        // Verify user is member
        const isMember = await isUserInConversation(socket.userId, convId);
        
        if (!isMember) {
          socket.emit("error", { message: "Not a member of this conversation" });
          return;
        }
        
        console.log(`${socket.username} joined conversation: ${convId}`);
        socket.join(conversationId.toString());
        
        // Load message history
        const result = await getMessages(convId, 50);
        socket.emit("messages:history", result.messages);
        
        // Mark as read
        await markConversationAsRead(convId, socket.userId);
      } catch (error) {
        console.error("Join conversation error:", error);
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    // Send message
    socket.on("message:send", async (payload) => {
      try {
        const { conversationId, content } = payload;
        const convId = parseInt(conversationId);
        
        // Verify user is member
        const isMember = await isUserInConversation(socket.userId, convId);
        
        if (!isMember) {
          socket.emit("error", { message: "Not a member of this conversation" });
          return;
        }
        
        console.log(`💬 Saving message from ${socket.username}...`);
        
        // Save to database
        const message = await saveMessage({
          conversationId: convId,
          senderId: socket.userId,
          content,
        });
        
        console.log(`✅ Message saved: ${message.id}`);
        
        // Broadcast to all users in conversation
        io.to(conversationId.toString()).emit("message:new", {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          sender: message.sender,
        });
      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Typing indicator
    socket.on("typing:start", async (conversationId) => {
      socket.to(conversationId.toString()).emit("typing:user", {
        userId: socket.userId,
        username: socket.username,
      });
    });

    socket.on("typing:stop", async (conversationId) => {
      socket.to(conversationId.toString()).emit("typing:stop", {
        userId: socket.userId,
      });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected", socket.id, socket.username);
    });
  });
}
```

---

## Environment Variables

### Update `.env`

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/chatapp"

# JWT Secret (change in production!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server
PORT=4000
NODE_ENV=development

# CORS Origin (your frontend URL)
CORS_ORIGIN="http://localhost:5173"
```

---

## Complete Setup Steps

### 1. Install Dependencies

```bash
npm install bcrypt jsonwebtoken @prisma/adapter-pg pg
```

### 2. Create Folders

```bash
mkdir src\db
mkdir src\routes
mkdir src\middleware
mkdir src\utils
```

### 3. Create All Files

Copy all the code above into the respective files:
- `src/db/prisma.js`
- `src/db/users.js`
- `src/db/conversations.js`
- `src/db/messages.js`
- `src/utils/jwt.js`
- `src/middleware/auth.js`
- `src/routes/auth.js`
- `src/routes/users.js`
- `src/routes/conversations.js`
- `src/routes/messages.js`
- `src/index.js` (replace existing)
- `src/sockets.js` (replace existing)

### 4. Run Seed

```bash
npm run db:seed
```

### 5. Start Server

```bash
npm run dev
```

---

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register
**Request:**
```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": 6,
    "username": "john",
    "email": "john@example.com",
    "displayName": "John Doe",
    "status": "offline"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### POST /api/auth/login
**Request:**
```json
{
  "email": "alice@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Conversation Endpoints

#### GET /api/conversations
**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "conversations": [
    {
      "id": 1,
      "isGroup": false,
      "name": null,
      "updatedAt": "2025-12-28T14:30:00.000Z",
      "members": [
        {
          "user": {
            "id": 2,
            "username": "bob",
            "displayName": "Bob Johnson",
            "status": "online"
          }
        }
      ],
      "messages": [
        {
          "id": 15,
          "content": "See you tomorrow!",
          "createdAt": "2025-12-28T14:25:00.000Z"
        }
      ],
      "unreadCount": 3
    }
  ]
}
```

---

#### POST /api/conversations
**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "otherUserId": 2
}
```

**Response:**
```json
{
  "conversation": {
    "id": 1,
    "isGroup": false,
    "createdAt": "2025-12-28T10:00:00.000Z"
  }
}
```

---

### Message Endpoints

#### GET /api/conversations/:id/messages
**Headers:** `Authorization: Bearer {token}`

**Query Params:**
- `limit` (optional, default: 50)
- `cursor` (optional, for pagination)

**Response:**
```json
{
  "messages": [
    {
      "id": 1,
      "conversationId": 1,
      "senderId": 1,
      "content": "Hello!",
      "createdAt": "2025-12-28T10:00:00.000Z",
      "sender": {
        "id": 1,
        "username": "alice",
        "displayName": "Alice Smith",
        "avatarUrl": "https://..."
      }
    }
  ],
  "hasMore": false,
  "nextCursor": null
}
```

---

#### POST /api/conversations/:id/messages
**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "content": "Hello from API!"
}
```

**Response:**
```json
{
  "message": {
    "id": 16,
    "conversationId": 1,
    "senderId": 1,
    "content": "Hello from API!",
    "createdAt": "2025-12-28T14:35:00.000Z",
    "sender": { ... }
  }
}
```

---

## Testing Workflow

### 1. Register a User

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"email\":\"test@test.com\",\"password\":\"test123\",\"displayName\":\"Test User\"}"
```

**Copy the token from response!**

### 2. Login (if already registered)

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"alice@example.com\",\"password\":\"password123\"}"
```

### 3. Get My Conversations

```bash
curl http://localhost:4000/api/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Create Conversation with Bob (ID: 2)

```bash
curl -X POST http://localhost:4000/api/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"otherUserId\":2}"
```

### 5. Send Message

```bash
curl -X POST http://localhost:4000/api/conversations/1/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"Hello from cURL!\"}"
```

### 6. Get Messages

```bash
curl http://localhost:4000/api/conversations/1/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Summary

**You now have:**
- ✅ Complete REST API with all endpoints
- ✅ JWT authentication
- ✅ Protected routes
- ✅ Database persistence
- ✅ Socket.IO integration
- ✅ User management
- ✅ Conversation management
- ✅ Message management

**Next steps:**
1. Create all the files
2. Install dependencies
3. Run seed
4. Start server
5. Test with cURL or Postman
6. Build frontend!

Would you like me to:
1. **Create a Postman collection** for easier testing?
2. **Add more features** (message editing, reactions, etc.)?
3. **Create frontend examples** (React/Vue) to connect to this API?
4. **Add API documentation** with Swagger/OpenAPI?