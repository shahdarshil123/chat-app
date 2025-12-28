# Chat Application - Architecture Decision Record (ADR)

## Document Purpose

This document explains the architectural decisions made for our chat application, with a focus on **flexibility** and **extensibility**. Our goal is to build for today's requirements (1-on-1 messaging) while making future enhancements (groups, editing, blocking, etc.) straightforward to implement.

---

## Table of Contents

1. [Core Design Philosophy](#core-design-philosophy)
2. [Database Choice: PostgreSQL](#database-choice-postgresql)
3. [Schema Design Decisions](#schema-design-decisions)
4. [Extensibility Patterns](#extensibility-patterns)
5. [Future Feature Roadmap](#future-feature-roadmap)
6. [Migration Paths](#migration-paths)
7. [Trade-offs & Alternatives](#trade-offs--alternatives)

---

## Core Design Philosophy

### Guiding Principles

**1. Design for Tomorrow, Build for Today**
- Implement only what's needed now
- Structure schema to accommodate future features without major rewrites
- Use patterns that scale gracefully

**2. Data Integrity First**
- Use foreign keys to prevent orphaned records
- Enforce constraints at database level, not just application
- ACID transactions for consistency

**3. Performance as Default**
- Index everything that will be queried
- Design queries for common operations upfront
- Plan for partitioning at scale

**4. Security by Design**
- Row-level security for data isolation
- Audit trails for sensitive operations
- Encryption-ready architecture

**5. Developer Experience Matters**
- Clear, self-documenting schema
- Helper functions for common operations
- Views for complex queries

---

## Database Choice: PostgreSQL

### Decision: Use PostgreSQL over MongoDB

**Context:**
We needed a database for a chat application with relational data (users, conversations, messages) and requirements for data integrity, message ordering, and future extensibility.

**Decision:**
We chose **PostgreSQL** over MongoDB and other alternatives.

**Rationale:**

✅ **Data is Inherently Relational**
- Users participate in conversations
- Messages belong to conversations
- These relationships are natural in a relational model

✅ **ACID Transactions**
- Critical for message ordering guarantees
- Prevents race conditions in multi-user scenarios
- Ensures data consistency during complex operations

✅ **Row-Level Security**
- Database-enforced access control (users can only see their conversations)
- Reduces security vulnerabilities from application bugs
- Defense in depth

✅ **Flexibility Through JSONB**
- Can store flexible metadata when needed
- Gets MongoDB-like benefits where appropriate
- Best of both worlds: structured + unstructured

✅ **Future-Proof**
- Rich feature set (full-text search, window functions, CTEs)
- Extensions ecosystem (PostGIS, pgvector, etc.)
- Proven at scale (Discord, Instagram use Postgres)

✅ **Cost & Licensing**
- Completely free, all features
- No enterprise edition upsell
- Lower hosting costs

**Consequences:**

👍 **Positives:**
- Strong data integrity guarantees
- Better performance for relational queries
- Universal SQL knowledge in team
- Easier to hire for

👎 **Negatives:**
- Schema migrations required for structural changes
- Vertical scaling may require sharding eventually (but not until very large scale)

**Status:** ✅ Accepted

**References:**
- [Discord: MongoDB → Cassandra blog post](https://discord.com/blog/how-discord-stores-billions-of-messages)
- [The Guardian: MongoDB → PostgreSQL blog post](https://theguardian.engineering/blog/info-2018-nov-30-bye-bye-mongo-hello-postgres)

---

## Schema Design Decisions

### ADR-001: Junction Table for User-Conversation Relationship

**Context:**
Need to link users to conversations. In 1-on-1 chats, exactly 2 users per conversation. In future group chats, 3+ users per conversation.

**Decision:**
Use a **junction table** (`conversation_members`) instead of storing user IDs directly in the conversations table.

**Alternatives Considered:**

❌ **Alternative 1: Store user IDs in conversations table**
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user1_id INT,
  user2_id INT
);
```
**Rejected because:**
- Hard-coded for exactly 2 users
- Cannot evolve to groups without major schema change
- Messy queries: `WHERE user1_id = X OR user2_id = X`
- Cannot store per-user metadata (role, join date, etc.)

❌ **Alternative 2: Array of user IDs**
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_ids INT[]
);
```
**Rejected because:**
- No foreign key constraints (data integrity risk)
- Harder to query and index
- Cannot store per-user metadata

✅ **Chosen Solution: Junction Table**
```sql
CREATE TABLE conversation_members (
  conversation_id INT REFERENCES conversations(id),
  user_id INT REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  last_read_at TIMESTAMP,
  PRIMARY KEY (conversation_id, user_id)
);
```

**Benefits:**
- ✅ Works for 1-on-1 (2 rows) and groups (3+ rows)
- ✅ Foreign key constraints enforce integrity
- ✅ Easy to query: "Get all conversations for user X"
- ✅ Per-user metadata (role, join time, last read)
- ✅ Easy to add/remove users
- ✅ No schema change needed when adding groups

**Consequences:**
- One extra join in queries (minimal performance impact with proper indexes)
- More tables to manage (but cleaner architecture)

**Status:** ✅ Accepted

---

### ADR-002: Single Conversations Table with is_group Flag

**Context:**
Need to support both 1-on-1 and group conversations, but starting with only 1-on-1.

**Decision:**
Use a **single conversations table** with an `is_group` boolean flag from day one.

**Alternatives Considered:**

❌ **Alternative 1: Separate tables**
```sql
CREATE TABLE direct_conversations (...);
CREATE TABLE group_conversations (...);
```
**Rejected because:**
- Complex queries across both types
- Messy application code
- Difficult to add features that apply to both
- Would need UNION queries

❌ **Alternative 2: Wait and add groups later**
```sql
-- Start with just conversations table
-- Add is_group field when needed
```
**Rejected because:**
- Adding boolean column later requires migration and application updates
- Safer to plan from the start
- No cost to adding flag now

✅ **Chosen Solution: Single table with flag**
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  is_group BOOLEAN DEFAULT false,
  name VARCHAR(255), -- NULL for 1-on-1, required for groups
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Benefits:**
- ✅ Simple queries: "Get all my conversations"
- ✅ No code changes when adding groups
- ✅ Shared logic for both types
- ✅ Easy filtering: `WHERE is_group = false`

**Implementation for 1-on-1:**
```sql
-- Creating 1-on-1 conversation
INSERT INTO conversations (is_group) VALUES (false);
-- name remains NULL
-- conversation_members has exactly 2 rows
```

**Implementation for groups (future):**
```sql
-- Creating group conversation
INSERT INTO conversations (is_group, name, created_by) 
VALUES (true, 'Team Chat', user_id);
-- name is required
-- conversation_members has 3+ rows
```

**Status:** ✅ Accepted

---

### ADR-003: ON DELETE Behavior for Foreign Keys

**Context:**
When a user or conversation is deleted, what happens to related data?

**Decision:**
Use **different CASCADE behaviors** based on data semantics.

**Rationale:**

| Relationship | ON DELETE | Reason |
|--------------|-----------|--------|
| `messages.conversation_id` | **CASCADE** | Messages are meaningless without conversation |
| `messages.sender_id` | **SET NULL** | Preserve message history, show "[Deleted User]" |
| `conversation_members.conversation_id` | **CASCADE** | Membership is meaningless without conversation |
| `conversation_members.user_id` | **CASCADE** | Remove user from all conversations |

**Example Scenarios:**

**Scenario 1: User deletes their account**
```sql
DELETE FROM users WHERE id = 123;
```
**Result:**
- User removed from all conversations (CASCADE)
- Their messages remain but `sender_id = NULL` (SET NULL)
- Frontend shows "[Deleted User]" for their messages

**Scenario 2: Delete a conversation**
```sql
DELETE FROM conversations WHERE id = 456;
```
**Result:**
- All messages deleted (CASCADE)
- All memberships deleted (CASCADE)
- Clean automatic cleanup

**Alternative Considered:**

❌ **CASCADE everything**
```sql
messages.sender_id ON DELETE CASCADE
```
**Rejected because:**
- Loses message history when user deletes account
- Users expect their messages to remain for others
- Breaks conversation context

**Status:** ✅ Accepted

---

### ADR-004: Message Ordering Strategy

**Context:**
Messages must be displayed in strict chronological order. Multiple messages can be sent simultaneously.

**Decision:**
Use **both timestamp and auto-incrementing ID** for ordering.

**Problem:**
```sql
-- Two messages sent at "same time"
id | created_at
1  | 2025-01-01 10:30:15.123456
2  | 2025-01-01 10:30:15.123456  -- Same timestamp!
```

**With only timestamp:**
```sql
ORDER BY created_at ASC
-- Undefined order when timestamps match!
-- Message order could flip between queries
```

✅ **Chosen Solution:**
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,  -- Auto-incrementing
  created_at TIMESTAMP DEFAULT NOW()
);

-- Query with both for deterministic ordering
SELECT * FROM messages 
WHERE conversation_id = ?
ORDER BY created_at ASC, id ASC;
```

**Benefits:**
- ✅ Guaranteed deterministic ordering
- ✅ Even with identical timestamps, `id` provides tiebreaker
- ✅ Monotonically increasing IDs are fast to index

**Index Design:**
```sql
CREATE INDEX idx_messages_conversation_time 
  ON messages(conversation_id, created_at, id);
-- Covers the entire ORDER BY clause
```

**Status:** ✅ Accepted

---

### ADR-005: Tracking Unread Messages

**Context:**
Need to show unread message counts and mark conversations as read.

**Decision:**
Store `last_read_at` timestamp in `conversation_members` table.

**Alternatives Considered:**

❌ **Alternative 1: Separate read_receipts table**
```sql
CREATE TABLE message_reads (
  message_id INT,
  user_id INT,
  read_at TIMESTAMP
);
```
**Rejected for MVP because:**
- Creates one row per message per user (large table)
- Overkill for simple "unread count"
- Better suited for "seen by" feature (future enhancement)

✅ **Chosen Solution: Timestamp in junction table**
```sql
CREATE TABLE conversation_members (
  conversation_id INT,
  user_id INT,
  last_read_at TIMESTAMP
);
```

**Calculating unread count:**
```sql
SELECT COUNT(*) as unread_count
FROM messages m
WHERE m.conversation_id = ?
  AND m.created_at > COALESCE(cm.last_read_at, '1970-01-01')
  AND m.sender_id != ?;  -- Don't count own messages
```

**Marking as read:**
```sql
UPDATE conversation_members
SET last_read_at = NOW()
WHERE conversation_id = ? AND user_id = ?;
```

**Benefits:**
- ✅ Simple and efficient for MVP
- ✅ One timestamp per user per conversation (small)
- ✅ Easy to calculate unread counts
- ✅ Can add detailed read receipts later without breaking this

**Future Enhancement Path:**
When we need per-message read receipts ("Seen by John, Jane"):
1. Add `message_reads` table
2. Keep `last_read_at` for quick unread counts
3. Use `message_reads` for detailed "seen by" UI

**Status:** ✅ Accepted

---

### ADR-006: Indexing Strategy

**Context:**
Chat applications have specific query patterns that need optimization.

**Decision:**
Create **covering indexes** for all frequent query patterns.

**Critical Indexes:**

**1. Messages by conversation (most frequent query):**
```sql
CREATE INDEX idx_messages_conversation_time 
  ON messages(conversation_id, created_at DESC, id DESC);
```
**Covers query:**
```sql
SELECT * FROM messages 
WHERE conversation_id = ?
ORDER BY created_at DESC, id DESC
LIMIT 50;
-- Uses index only, no table scan
```

**2. User's conversations:**
```sql
CREATE INDEX idx_members_user 
  ON conversation_members(user_id);
```
**Covers query:**
```sql
SELECT conversation_id FROM conversation_members 
WHERE user_id = ?;
```

**3. Conversation's members:**
```sql
CREATE INDEX idx_members_conversation 
  ON conversation_members(conversation_id);
```
**Covers query:**
```sql
SELECT user_id FROM conversation_members 
WHERE conversation_id = ?;
```

**4. Recent conversations (for inbox view):**
```sql
CREATE INDEX idx_conversations_updated 
  ON conversations(updated_at DESC);
```

**Performance Impact:**
- Without indexes: Queries take **seconds** (table scans)
- With indexes: Queries take **milliseconds** (index scans)

**Maintenance:**
```sql
-- Monitor unused indexes
SELECT 
  schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Status:** ✅ Accepted

---

### ADR-007: Soft Deletes vs Hard Deletes

**Context:**
When users "delete" messages or conversations, should we actually delete the data?

**Decision:**
**Hard deletes** for MVP, with path to soft deletes if needed.

**Rationale:**

**For MVP:**
- ✅ Simpler implementation
- ✅ True data deletion (privacy-friendly)
- ✅ Smaller database size
- ✅ No ghost data to filter out

**When to add soft deletes:**
- User wants to "undo" deletion
- Compliance requires audit trail
- Need to track deleted content

**Future Enhancement Path:**
```sql
-- Add soft delete columns when needed
ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE messages ADD COLUMN deleted_by INT REFERENCES users(id);

-- Queries become:
SELECT * FROM messages 
WHERE conversation_id = ?
  AND deleted_at IS NULL;  -- Filter out deleted

-- Create index for performance
CREATE INDEX idx_messages_not_deleted 
  ON messages(conversation_id, created_at) 
  WHERE deleted_at IS NULL;
```

**Status:** ✅ Accepted for MVP, revisit when needed

---

## Extensibility Patterns

### How to Add Future Features Without Breaking Changes

---

### 1. Adding Group Chats

**Status:** ✅ Schema already supports this!

**What to do:**
```sql
-- 1. Create group conversation
INSERT INTO conversations (is_group, name, created_by)
VALUES (true, 'Team Chat', user_id)
RETURNING id;

-- 2. Add multiple members
INSERT INTO conversation_members (conversation_id, user_id, role)
VALUES 
  (conv_id, user1_id, 'admin'),
  (conv_id, user2_id, 'member'),
  (conv_id, user3_id, 'member');

-- 3. No schema changes needed!
```

**Application changes:**
- Update UI to show group name
- Add "Add member" functionality
- Handle admin permissions

**Database changes:**
- None! Schema already supports it

---

### 2. Adding Message Editing

**Schema change needed:**
```sql
-- Add edit tracking to messages table
ALTER TABLE messages 
  ADD COLUMN edited_at TIMESTAMP,
  ADD COLUMN edit_count INT DEFAULT 0;

-- Create edit history table
CREATE TABLE message_edits (
  id SERIAL PRIMARY KEY,
  message_id INT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  old_content TEXT NOT NULL,
  edited_by INT REFERENCES users(id) ON DELETE SET NULL,
  edited_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_edits_message ON message_edits(message_id);
```

**Edit flow:**
```sql
-- Before editing, save history
BEGIN;

-- 1. Store old content
INSERT INTO message_edits (message_id, old_content, edited_by)
SELECT id, content, sender_id 
FROM messages 
WHERE id = ?;

-- 2. Update message
UPDATE messages
SET 
  content = 'new content',
  edited_at = NOW(),
  edit_count = edit_count + 1
WHERE id = ?;

COMMIT;
```

**UI changes:**
- Show "edited" indicator
- "View edit history" option
- Edit button for own messages

**Migration:** One-time ALTER TABLE (non-breaking, columns are nullable)

---

### 3. Adding User Blocking

**Schema change needed:**
```sql
CREATE TABLE user_blocks (
  blocker_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_at TIMESTAMP DEFAULT NOW(),
  reason TEXT,
  PRIMARY KEY (blocker_id, blocked_id),
  
  -- Can't block yourself
  CONSTRAINT check_not_self_block CHECK (blocker_id != blocked_id)
);

CREATE INDEX idx_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON user_blocks(blocked_id);
```

**Application logic:**
```sql
-- Check if user is blocked before showing messages
SELECT EXISTS(
  SELECT 1 FROM user_blocks
  WHERE blocker_id = ? AND blocked_id = ?
) as is_blocked;

-- Filter conversations to exclude blocked users
SELECT c.* 
FROM conversations c
JOIN conversation_members cm ON c.id = cm.conversation_id
WHERE cm.user_id = ?
  AND NOT EXISTS (
    SELECT 1 FROM user_blocks ub
    WHERE ub.blocker_id = ? 
      AND ub.blocked_id IN (
        SELECT user_id FROM conversation_members 
        WHERE conversation_id = c.id
      )
  );
```

**Migration:** New table, no changes to existing schema

---

### 4. Adding Message Reactions

**Schema change needed:**
```sql
CREATE TABLE message_reactions (
  id SERIAL PRIMARY KEY,
  message_id INT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction VARCHAR(50) NOT NULL, -- '👍', '❤️', '😂', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- User can't react multiple times with same emoji
  UNIQUE(message_id, user_id, reaction)
);

CREATE INDEX idx_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_reactions_user ON message_reactions(user_id);
```

**Queries:**
```sql
-- Get reactions for message
SELECT 
  reaction, 
  COUNT(*) as count,
  ARRAY_AGG(user_id) as user_ids
FROM message_reactions
WHERE message_id = ?
GROUP BY reaction;

-- Add reaction
INSERT INTO message_reactions (message_id, user_id, reaction)
VALUES (?, ?, '👍')
ON CONFLICT (message_id, user_id, reaction) DO NOTHING;

-- Remove reaction
DELETE FROM message_reactions
WHERE message_id = ? AND user_id = ? AND reaction = '👍';
```

**Migration:** New table, no changes to existing schema

---

### 5. Adding Message Threading (Replies)

**Schema change needed:**
```sql
-- Add parent reference to messages
ALTER TABLE messages 
  ADD COLUMN parent_message_id INT REFERENCES messages(id) ON DELETE CASCADE,
  ADD CONSTRAINT check_not_self_parent CHECK (id != parent_message_id);

CREATE INDEX idx_messages_parent ON messages(parent_message_id);
```

**Queries:**
```sql
-- Get thread (parent + all replies)
SELECT * FROM messages
WHERE id = ? OR parent_message_id = ?
ORDER BY created_at;

-- Recursive query for nested replies
WITH RECURSIVE thread AS (
  SELECT id, parent_message_id, content, 0 as depth
  FROM messages WHERE id = ?
  
  UNION ALL
  
  SELECT m.id, m.parent_message_id, m.content, t.depth + 1
  FROM messages m
  JOIN thread t ON m.parent_message_id = t.id
)
SELECT * FROM thread ORDER BY depth, created_at;
```

**Migration:** ALTER TABLE to add nullable column (non-breaking)

---

### 6. Adding Message Types (Text, Image, File, Voice)

**Schema change needed:**
```sql
-- Add message type and metadata
ALTER TABLE messages 
  ADD COLUMN message_type VARCHAR(50) DEFAULT 'text',
  ADD COLUMN metadata JSONB DEFAULT '{}';

CREATE INDEX idx_messages_metadata ON messages USING GIN(metadata);
```

**Examples:**
```sql
-- Text message
INSERT INTO messages (conversation_id, sender_id, message_type, content)
VALUES (1, 5, 'text', 'Hello!');

-- Image message
INSERT INTO messages (conversation_id, sender_id, message_type, content, metadata)
VALUES (1, 5, 'image', 'Check this out!', '{
  "image_url": "https://...",
  "thumbnail_url": "https://...",
  "width": 1920,
  "height": 1080,
  "file_size": 245678
}');

-- File message
INSERT INTO messages (conversation_id, sender_id, message_type, content, metadata)
VALUES (1, 5, 'file', 'Here\'s the document', '{
  "file_url": "https://...",
  "file_name": "report.pdf",
  "file_size": 1024000,
  "mime_type": "application/pdf"
}');

-- Voice message
INSERT INTO messages (conversation_id, sender_id, message_type, metadata)
VALUES (1, 5, 'voice', '{
  "audio_url": "https://...",
  "duration_seconds": 45,
  "waveform": [0.1, 0.3, 0.5, ...]
}');
```

**Query by type:**
```sql
SELECT * FROM messages 
WHERE conversation_id = ?
  AND message_type = 'image'
ORDER BY created_at DESC;

-- Query JSONB fields
SELECT * FROM messages
WHERE metadata->>'file_size' > '1000000';
```

**Migration:** ALTER TABLE to add columns with defaults (non-breaking)

---

### 7. Adding Typing Indicators

**Schema change needed:**
```sql
CREATE TABLE typing_indicators (
  conversation_id INT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_typing_conversation ON typing_indicators(conversation_id);
```

**Application logic:**
```sql
-- User starts typing
INSERT INTO typing_indicators (conversation_id, user_id)
VALUES (?, ?)
ON CONFLICT (conversation_id, user_id) 
DO UPDATE SET started_at = NOW();

-- Get who's typing (only show recent)
SELECT u.username
FROM typing_indicators ti
JOIN users u ON ti.user_id = u.id
WHERE ti.conversation_id = ?
  AND ti.started_at > NOW() - INTERVAL '5 seconds'
  AND ti.user_id != ?;  -- Don't show yourself

-- Clean up old indicators (cron job)
DELETE FROM typing_indicators
WHERE started_at < NOW() - INTERVAL '10 seconds';
```

**Migration:** New table, no changes to existing schema

---

### 8. Adding Message Search

**Schema change needed:**
```sql
-- Add full-text search column
ALTER TABLE messages 
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- Create GIN index for fast search
CREATE INDEX idx_messages_search 
  ON messages USING GIN(search_vector);
```

**Search query:**
```sql
-- Simple search
SELECT 
  m.*,
  ts_rank(m.search_vector, query) as rank
FROM messages m,
     to_tsquery('english', 'search & terms') query
WHERE m.search_vector @@ query
  AND m.conversation_id IN (
    SELECT conversation_id FROM conversation_members WHERE user_id = ?
  )
ORDER BY rank DESC, m.created_at DESC
LIMIT 50;

-- Search with highlighting
SELECT 
  m.id,
  m.content,
  ts_headline('english', m.content, query) as highlighted
FROM messages m,
     to_tsquery('english', 'search & terms') query
WHERE m.search_vector @@ query;
```

**Migration:** ALTER TABLE with GENERATED column, then create index

---

### 9. Adding Pinned Messages

**Schema change needed:**
```sql
CREATE TABLE pinned_messages (
  conversation_id INT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id INT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by INT REFERENCES users(id) ON DELETE SET NULL,
  pinned_at TIMESTAMP DEFAULT NOW(),
  pin_order INT DEFAULT 0, -- For multiple pins
  PRIMARY KEY (conversation_id, message_id)
);

CREATE INDEX idx_pinned_conversation ON pinned_messages(conversation_id, pin_order);
```

**Queries:**
```sql
-- Get pinned messages for conversation
SELECT 
  m.*,
  pm.pinned_by,
  pm.pinned_at
FROM pinned_messages pm
JOIN messages m ON pm.message_id = m.id
WHERE pm.conversation_id = ?
ORDER BY pm.pin_order, pm.pinned_at;

-- Pin a message
INSERT INTO pinned_messages (conversation_id, message_id, pinned_by)
VALUES (?, ?, ?);

-- Unpin a message
DELETE FROM pinned_messages
WHERE conversation_id = ? AND message_id = ?;
```

**Migration:** New table, no changes to existing schema

---

### 10. Adding User Presence (Online/Offline Status)

**Schema change needed:**
```sql
-- Add to users table
ALTER TABLE users 
  ADD COLUMN status VARCHAR(50) DEFAULT 'offline', -- 'online', 'offline', 'away'
  ADD COLUMN last_seen TIMESTAMP;

CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_seen ON users(last_seen);
```

**Application logic:**
```sql
-- User comes online
UPDATE users
SET status = 'online', last_seen = NOW()
WHERE id = ?;

-- User goes offline
UPDATE users
SET status = 'offline', last_seen = NOW()
WHERE id = ?;

-- Get online users in conversation
SELECT u.*
FROM users u
JOIN conversation_members cm ON u.id = cm.user_id
WHERE cm.conversation_id = ?
  AND u.status = 'online';

-- Show "last seen" for offline users
SELECT u.username, u.last_seen
FROM users u
WHERE u.id = ?
  AND u.status = 'offline';
```

**Migration:** ALTER TABLE with DEFAULT values (non-breaking)

---

## Future Feature Roadmap

### Phase 1: MVP (Current)
- ✅ User registration and authentication
- ✅ 1-on-1 conversations
- ✅ Real-time messaging
- ✅ Message history
- ✅ Unread message counts
- ✅ User online/offline status

### Phase 2: Enhanced Messaging (3-6 months)
- Group chats (schema ready!)
- Message editing (with history)
- Message reactions (👍, ❤️, 😂)
- Typing indicators
- Read receipts ("Seen by")

### Phase 3: Rich Content (6-9 months)
- Image messages
- File attachments
- Voice messages
- Video messages
- Message types with metadata (JSONB ready!)

### Phase 4: Advanced Features (9-12 months)
- Message search (full-text)
- Threaded replies
- Pinned messages
- Message forwarding
- User blocking
- Mute conversations

### Phase 5: Scale & Polish (12+ months)
- Message archiving
- Data retention policies
- Analytics and insights
- Message export
- Advanced permissions
- Encryption at rest

---

## Migration Paths

### How to Safely Add Features

**1. Additive Changes (Safe)**
```sql
-- Adding new columns (with defaults)
ALTER TABLE messages 
  ADD COLUMN edited_at TIMESTAMP,
  ADD COLUMN message_type VARCHAR(50) DEFAULT 'text';
-- Safe: Existing queries unaffected
```

**2. New Tables (Safe)**
```sql
-- Adding new functionality
CREATE TABLE message_reactions (...);
-- Safe: No impact on existing tables
```

**3. New Indexes (Safe, but lock table briefly)**
```sql
-- Add index for new feature
CREATE INDEX CONCURRENTLY idx_new_feature 
  ON messages(new_column);
-- Use CONCURRENTLY to avoid locking in production
```

**4. Removing Columns (Requires care)**
```sql
-- Step 1: Stop using column in application
-- Step 2: Deploy application
-- Step 3: Remove column from database
ALTER TABLE messages DROP COLUMN old_column;
```

**5. Changing Constraints (Requires care)**
```sql
-- Step 1: Add new column with desired constraint
-- Step 2: Migrate data
-- Step 3: Update application
-- Step 4: Remove old column
```

### Migration Checklist

Before any schema change:
- [ ] Backup database
- [ ] Test migration on staging environment
- [ ] Verify application still works
- [ ] Check query performance impact
- [ ] Plan rollback procedure
- [ ] Schedule during low-traffic period
- [ ] Monitor after deployment

---

## Trade-offs & Alternatives

### What We Chose Not To Do (And Why)

**1. ❌ NoSQL/MongoDB**
- **Why not:** Chat data is relational, need data integrity, proven Postgres scale
- **When to reconsider:** If we need horizontal sharding at massive scale (billions of users)

**2. ❌ Microservices Architecture**
- **Why not:** Overkill for MVP, adds complexity, harder to maintain
- **When to reconsider:** When team grows to 50+ engineers, clear service boundaries emerge

**3. ❌ Event Sourcing**
- **Why not:** Complexity not justified for MVP, harder to query current state
- **When to reconsider:** If we need complete audit trail of every change

**4. ❌ Separate Tables for 1-on-1 vs Groups**
- **Why not:** Complex queries, messy code, no benefits
- **When to reconsider:** Never. Single table with flag is superior.

**5. ❌ Storing Messages in Separate Table Per Conversation**
- **Why not:** Impossible to query across conversations, table explosion
- **When to reconsider:** Never. Use partitioning if needed.

**6. ❌ GraphQL Instead of REST**
- **Why not:** Simpler to start with REST, GraphQL adds complexity
- **When to reconsider:** When clients need very flexible queries, multiple clients

**7. ❌ Client-Side Encryption**
- **Why not:** Complex key management, limited search/features
- **When to reconsider:** If end-to-end encryption becomes requirement

---

## Performance Considerations

### Query Performance Targets

| Operation | Target Latency | Reasoning |
|-----------|---------------|-----------|
| Fetch recent messages | < 50ms | Real-time feel |
| Send message | < 100ms | Includes DB write |
| Get conversation list | < 100ms | Inbox view |
| Search messages | < 500ms | Acceptable for search |
| Create conversation | < 100ms | One-time operation |

### Scaling Strategy

**Phase 1: Vertical Scaling (0 - 100K users)**
- Single PostgreSQL instance
- Read replicas for analytics
- Connection pooling (PgBouncer)

**Phase 2: Caching (100K - 1M users)**
- Redis for session data
- Cache recent messages
- Cache conversation lists

**Phase 3: Partitioning (1M - 10M users)**
- Partition messages table by date
- Partition by conversation_id if needed
- Archive old messages to cold storage

**Phase 4: Sharding (10M+ users)**
- Shard by user_id or conversation_id
- Use Citus extension for distributed Postgres
- Consider separate read/write clusters

### When to Optimize

**Optimize when:**
- ✅ Queries consistently exceed targets
- ✅ Database CPU > 70%
- ✅ Database becomes bottleneck
- ✅ User complaints about speed

**Don't optimize when:**
- ❌ "Just in case" (premature optimization)
- ❌ Everything is fast already
- ❌ No user complaints
- ❌ Small user base (< 1000 users)

**Optimization order:**
1. Add missing indexes
2. Optimize slow queries (use EXPLAIN ANALYZE)
3. Add caching
4. Scale vertically (bigger server)
5. Add read replicas
6. Partition tables
7. Shard (last resort)

---

## Security Considerations

### Defense in Depth

**Layer 1: Application**
- Authentication (JWT tokens)
- Authorization checks before every operation
- Input validation and sanitization
- Rate limiting

**Layer 2: Database**
- Row-level security policies
- Foreign key constraints
- CHECK constraints
- Audit logging

**Layer 3: Network**
- SSL/TLS for all connections
- Database not publicly accessible
- VPC/private network
- Firewall rules

**Layer 4: Data**
- Password hashing (bcrypt/Argon2)
- Sensitive data encryption
- Regular backups
- Access logs

### Row-Level Security Example

```sql
-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see messages in their conversations
CREATE POLICY messages_select_policy ON messages
FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_members 
    WHERE user_id = current_setting('app.current_user_id')::int
  )
);

-- Policy: Users can only insert messages in their conversations
CREATE POLICY messages_insert_policy ON messages
FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_members 
    WHERE user_id = current_setting('app.current_user_id')::int
  )
  AND sender_id = current_setting('app.current_user_id')::int
);
```

### Audit Trail

```sql
-- Track sensitive operations
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  action VARCHAR(100),
  resource_type VARCHAR(50),
  resource_id INT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Log important actions
INSERT INTO audit_log (user_id, action, resource_type, resource_id)
VALUES (?, 'delete_message', 'message', ?);
```

---

## Monitoring & Observability

### Key Metrics to Track

**Application Metrics:**
- Messages sent per second
- API response times (p50, p95, p99)
- Error rates
- Active users

**Database Metrics:**
- Query latency
- Connection count
- Cache hit ratio
- Slow queries
- Table sizes

**Business Metrics:**
- Daily active users
- Messages per user
- Conversation creation rate
- User retention

### Monitoring Queries

```sql
-- Find slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- > 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- Index usage
SELECT 
  schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0  -- Unused indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- Active connections
SELECT 
  COUNT(*) as connections,
  state
FROM pg_stat_activity
GROUP BY state;
```

---

## Testing Strategy

### Database Testing

**1. Unit Tests**
- Test database constraints
- Test triggers and functions
- Test CASCADE behavior

**2. Integration Tests**
- Test common query patterns
- Test concurrent operations
- Test transaction isolation

**3. Performance Tests**
- Load test with realistic data volume
- Test with 1M+ messages
- Test query performance

**4. Migration Tests**
- Test each migration up and down
- Test on copy of production data
- Verify no data loss

### Test Data Generation

```sql
-- Generate test users
INSERT INTO users (username, email, password_hash)
SELECT 
  'user_' || generate_series,
  'user' || generate_series || '@example.com',
  'hashed_password'
FROM generate_series(1, 10000);

-- Generate test conversations
INSERT INTO conversations (is_group, created_by)
SELECT 
  false,
  (random() * 10000)::int + 1
FROM generate_series(1, 50000);

-- Generate test messages
INSERT INTO messages (conversation_id, sender_id, content)
SELECT 
  (random() * 50000)::int + 1,
  (random() * 10000)::int + 1,
  'Test message ' || generate_series
FROM generate_series(1, 1000000);
```

---

## Documentation & Knowledge Transfer

### For Future Developers

**1. Schema Documentation**
- This ADR document
- ER diagrams (create with dbdiagram.io)
- Table descriptions in code comments

**2. Common Operations**
- Create conversation
- Send message
- Mark as read
- Get unread count
- Document as code comments

**3. Debugging Guide**
- Common errors and solutions
- How to investigate slow queries
- Where to find logs

**4. Deployment Guide**
- Migration procedures
- Rollback procedures
- Backup/restore procedures

---

## Conclusion

This architecture is designed to:

✅ **Start Simple:** MVP with core features only  
✅ **Stay Flexible:** Easy to add features without rewrites  
✅ **Scale Gracefully:** From 10 to 10M users  
✅ **Maintain Quality:** Strong data integrity guarantees  
✅ **Enable Speed:** Fast development with clear patterns  

**Key Principle:** *"Make the common case fast, make the uncommon case possible"*

We prioritize:
1. Data integrity (foreign keys, constraints)
2. Performance (indexes, efficient queries)
3. Flexibility (JSONB, extensible schema)
4. Security (RLS, audit logging)
5. Maintainability (clear structure, documentation)

**Next Steps:**
1. Implement core schema
2. Build API layer
3. Test with realistic data
4. Deploy MVP
5. Iterate based on usage

---

## References & Resources

**Official Documentation:**
- PostgreSQL Docs: https://www.postgresql.org/docs/
- PostgreSQL Tutorial: https://www.postgresqltutorial.com/

**Best Practices:**
- Use The Index, Luke: https://use-the-index-luke.com/
- Database Design Patterns

**Real-World Examples:**
- Discord's MongoDB → Cassandra migration: https://discord.com/blog/how-discord-stores-billions-of-messages
- The Guardian's MongoDB → PostgreSQL migration: https://theguardian.engineering/blog/info-2018-nov-30-bye-bye-mongo-hello-postgres

**Tools:**
- pgAdmin: Database management
- DBeaver: Universal database tool
- dbdiagram.io: Create ER diagrams
- Flyway: Database migrations

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Authors:** Development Team  
**Status:** Living Document (update as decisions are made)

---

**Remember:** This document should evolve as the application grows. Update it when:
- New architectural decisions are made
- Features are added
- Trade-offs are reconsidered
- Patterns emerge from usage

**Questions or suggestions?** Open an issue or start a discussion!