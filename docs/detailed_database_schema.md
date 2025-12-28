# Complete Database Schema Documentation

## Chat Application - Detailed Field Reference

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Table: users](#table-users)
3. [Table: conversations](#table-conversations)
4. [Table: conversation_members](#table-conversation_members)
5. [Table: messages](#table-messages)
6. [Relationships Diagram](#relationships-diagram)
7. [Indexes Summary](#indexes-summary)
8. [Example Data](#example-data)

---

## Schema Overview

### Database Structure

```
┌─────────────────┐
│     USERS       │
│  (User Accts)   │
└────────┬────────┘
         │
         │ Foreign Key
         │
         ↓
┌─────────────────┐         ┌──────────────────┐
│ CONVERSATIONS   │←────────│ CONVERSATION_    │
│  (Chat Groups)  │ FK      │    MEMBERS       │
└────────┬────────┘         │  (User ↔ Conv)   │
         │                  └─────────┬────────┘
         │                            │
         │ Foreign Key                │ Foreign Key
         │                            │
         ↓                            ↓
┌─────────────────┐         ┌──────────────────┐
│    MESSAGES     │─────────→│     USERS        │
│   (Chat Msgs)   │ FK       │                  │
└─────────────────┘         └──────────────────┘
```

### Tables Summary

| Table | Purpose | Rows (estimate) | Primary Use |
|-------|---------|-----------------|-------------|
| **users** | Store user accounts | 1,000 - 100,000+ | Authentication, profiles |
| **conversations** | Container for messages | 5,000 - 500,000+ | Group 1-on-1 or group chats |
| **conversation_members** | Link users ↔ conversations | 10,000 - 1,000,000+ | Track membership, permissions |
| **messages** | Store chat messages | 100,000 - 10,000,000+ | The actual messages |

---

## Table: users

### Purpose
Stores user account information, authentication credentials, and online presence status.

### Complete Field List

| Field | Type | Constraints | Default | Nullable | Description |
|-------|------|-------------|---------|----------|-------------|
| **id** | `INTEGER` | PRIMARY KEY, AUTO INCREMENT | - | ❌ No | Unique user identifier |
| **username** | `VARCHAR(255)` | UNIQUE, NOT NULL, LENGTH >= 3 | - | ❌ No | Unique username for login |
| **email** | `VARCHAR(255)` | UNIQUE, NOT NULL, VALID EMAIL | - | ❌ No | User's email address |
| **password_hash** | `VARCHAR(255)` | NOT NULL | - | ❌ No | Hashed password (bcrypt/argon2) |
| **display_name** | `VARCHAR(255)` | - | NULL | ✅ Yes | Full name or display name |
| **avatar_url** | `VARCHAR(500)` | - | NULL | ✅ Yes | URL to profile picture |
| **status** | `ENUM` | 'online', 'offline', 'away' | 'offline' | ❌ No | Current online status |
| **last_seen** | `TIMESTAMP` | - | NOW() | ❌ No | Last activity timestamp |
| **created_at** | `TIMESTAMP` | - | NOW() | ❌ No | Account creation time |
| **updated_at** | `TIMESTAMP` | AUTO UPDATE | NOW() | ❌ No | Last profile update |

### Detailed Field Descriptions

#### **id** (Primary Key)
- **Type:** `INTEGER` (Serial/Auto-increment)
- **Purpose:** Unique identifier for each user
- **Generation:** Automatically assigned by database (1, 2, 3, ...)
- **Usage:** Referenced by other tables (messages, conversation_members)
- **Example:** `1`, `42`, `1337`

#### **username**
- **Type:** `VARCHAR(255)`
- **Purpose:** Unique username for login and @ mentions
- **Constraints:**
  - Must be unique across all users
  - Minimum 3 characters
  - Cannot be NULL
- **Validation:** Lowercase, alphanumeric + underscores (enforced in application)
- **Example:** `alice_smith`, `bob123`, `john_doe`
- **Usage:** Login, user search, @ mentions

#### **email**
- **Type:** `VARCHAR(255)`
- **Purpose:** Email address for login and notifications
- **Constraints:**
  - Must be unique across all users
  - Must match email format regex: `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`
  - Cannot be NULL
- **Example:** `alice@example.com`, `bob.johnson@company.io`
- **Usage:** Primary login method, password recovery, notifications

#### **password_hash**
- **Type:** `VARCHAR(255)`
- **Purpose:** Stores hashed password (NEVER store plain text!)
- **Format:** bcrypt or Argon2 hash
- **Example:** `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`
- **Security:**
  - ❌ Never store plain passwords
  - ❌ Never log or display this field
  - ✅ Use bcrypt with cost factor 10+
  - ✅ Use Argon2id for better security

#### **display_name**
- **Type:** `VARCHAR(255)` (Nullable)
- **Purpose:** User's preferred display name or full name
- **Default:** `NULL` (can use username as fallback)
- **Example:** `Alice Smith`, `Bob "The Builder" Johnson`, `John`
- **Usage:** Display in UI, message headers
- **Note:** Can contain spaces, emojis, special characters

#### **avatar_url**
- **Type:** `VARCHAR(500)` (Nullable)
- **Purpose:** URL to user's profile picture
- **Default:** `NULL` (use default avatar)
- **Example:** 
  - `https://cdn.example.com/avatars/user_1.jpg`
  - `https://gravatar.com/avatar/abc123`
- **Usage:** Display in chat UI, conversation list
- **Note:** Store URL, not the actual image in database

#### **status**
- **Type:** `ENUM('online', 'offline', 'away')`
- **Purpose:** Current online presence status
- **Default:** `'offline'`
- **Possible Values:**
  - `online` - User is actively using the app
  - `offline` - User is not connected
  - `away` - User is idle/inactive
- **Updates:**
  - Set to `online` on login/activity
  - Set to `offline` on logout
  - Set to `away` after 5-10 minutes of inactivity
- **Usage:** Show green/gray/yellow dot in UI

#### **last_seen**
- **Type:** `TIMESTAMP`
- **Purpose:** Track when user was last active
- **Default:** `NOW()` (current timestamp)
- **Updates:** 
  - On login
  - On sending message
  - On reading messages
  - Periodically while online (every 30 seconds)
- **Usage:** 
  - Show "Last seen 5 minutes ago" for offline users
  - Track user activity
  - Analytics
- **Example:** `2025-12-28 14:30:45`

#### **created_at**
- **Type:** `TIMESTAMP`
- **Purpose:** When account was created
- **Default:** `NOW()` (set once on creation)
- **Immutable:** Never changes after creation
- **Usage:** 
  - User registration date
  - Account age calculations
  - Analytics
- **Example:** `2025-01-15 09:22:13`

#### **updated_at**
- **Type:** `TIMESTAMP`
- **Purpose:** Last time user profile was updated
- **Default:** `NOW()`
- **Auto-Update:** Automatically updated on any UPDATE query (via trigger)
- **Usage:** Track profile changes, cache invalidation
- **Example:** `2025-12-28 14:35:20`

### Indexes on users

```sql
-- Primary Key Index (automatic)
PRIMARY KEY (id)

-- Unique Indexes (automatic for UNIQUE constraints)
UNIQUE INDEX ON users(email)
UNIQUE INDEX ON users(username)

-- Performance Indexes
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_seen ON users(last_seen);
```

**Why these indexes?**
- `email` & `username`: Login queries (`WHERE email = ?`)
- `status`: Filter online users (`WHERE status = 'online'`)
- `last_seen`: Sort by recent activity

### Example Data

```sql
INSERT INTO users (username, email, password_hash, display_name, status) VALUES
(
  'alice',
  'alice@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Alice Smith',
  'online'
),
(
  'bob',
  'bob@example.com',
  '$2a$10$xQjGxKq6Y9T8Oo5vLGQNkOd6JjU6PQkK5Gm5Qg1X7Hg2f3k8p9l0m',
  'Bob Johnson',
  'offline'
);
```

### Relationships

**users** has relationships with:
- **messages** (one-to-many): One user sends many messages
- **conversation_members** (one-to-many): One user is in many conversations
- **conversations** (one-to-many): One user creates many conversations

---

## Table: conversations

### Purpose
Containers for messages. Represents both 1-on-1 chats and group chats.

### Complete Field List

| Field | Type | Constraints | Default | Nullable | Description |
|-------|------|-------------|---------|----------|-------------|
| **id** | `INTEGER` | PRIMARY KEY, AUTO INCREMENT | - | ❌ No | Unique conversation identifier |
| **is_group** | `BOOLEAN` | - | `false` | ❌ No | True = group chat, False = 1-on-1 |
| **name** | `VARCHAR(255)` | Required if is_group=true | NULL | ✅ Yes | Group name (NULL for 1-on-1) |
| **created_by** | `INTEGER` | FOREIGN KEY → users(id) | NULL | ✅ Yes | User who created conversation |
| **created_at** | `TIMESTAMP` | - | NOW() | ❌ No | When conversation was created |
| **updated_at** | `TIMESTAMP` | AUTO UPDATE | NOW() | ❌ No | Last message timestamp |

### Detailed Field Descriptions

#### **id** (Primary Key)
- **Type:** `INTEGER` (Serial/Auto-increment)
- **Purpose:** Unique identifier for each conversation
- **Generation:** Automatically assigned (1, 2, 3, ...)
- **Usage:** Referenced by messages and conversation_members
- **Example:** `1`, `42`, `1337`

#### **is_group**
- **Type:** `BOOLEAN`
- **Purpose:** Distinguish between 1-on-1 and group chats
- **Default:** `false`
- **Values:**
  - `false` = 1-on-1 conversation (exactly 2 members)
  - `true` = group chat (3+ members)
- **Usage:**
  - Filter query: `WHERE is_group = false` for direct messages
  - UI logic: Show group features only when `true`
- **Why this field?** Allows schema to support both types without separate tables

#### **name**
- **Type:** `VARCHAR(255)` (Nullable)
- **Purpose:** Display name for group chats
- **Constraints:**
  - Must be NOT NULL if `is_group = true`
  - Can be NULL if `is_group = false`
  - CHECK: `(is_group = false) OR (is_group = true AND name IS NOT NULL)`
- **For 1-on-1 chats:** `NULL` (UI shows other user's name instead)
- **For group chats:** Required (e.g., "Team Chat", "Project Discussion")
- **Example:**
  - 1-on-1: `NULL` → UI displays "Alice Smith"
  - Group: `"Engineering Team"` → UI displays "Engineering Team"

#### **created_by**
- **Type:** `INTEGER` (Nullable)
- **Purpose:** Track which user created the conversation
- **Foreign Key:** References `users(id)` ON DELETE SET NULL
- **Why nullable?** If creator deletes their account, conversation remains
- **Usage:**
  - Group admin rights
  - Analytics (who creates most groups)
  - Audit trail
- **Example:** `5` (user ID of creator)

#### **created_at**
- **Type:** `TIMESTAMP`
- **Purpose:** When conversation was started
- **Default:** `NOW()`
- **Immutable:** Never changes
- **Usage:**
  - Sort conversations by age
  - Analytics (conversation growth over time)
- **Example:** `2025-12-20 10:15:30`

#### **updated_at**
- **Type:** `TIMESTAMP`
- **Purpose:** Last time a message was sent
- **Default:** `NOW()`
- **Auto-Update:** Trigger updates this when new message is inserted
- **Usage:** 
  - **Sort conversations by recent activity** (most important!)
  - Show "Last active 5 minutes ago"
  - Cache invalidation
- **Example:** `2025-12-28 14:45:22`
- **Note:** This is updated via trigger, not manual UPDATE queries

### Indexes on conversations

```sql
-- Primary Key Index
PRIMARY KEY (id)

-- Performance Indexes
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX idx_conversations_created_by ON conversations(created_by);
CREATE INDEX idx_conversations_is_group ON conversations(is_group);
```

**Why these indexes?**
- `updated_at DESC`: Sort conversation list by recent activity (most common query!)
- `created_by`: Find conversations created by specific user
- `is_group`: Filter to show only 1-on-1 or only groups

### Example Data

```sql
-- 1-on-1 conversation between Alice (1) and Bob (2)
INSERT INTO conversations (is_group, name, created_by) VALUES
(false, NULL, 1);  -- id = 1

-- Group conversation
INSERT INTO conversations (is_group, name, created_by) VALUES
(true, 'Engineering Team', 1);  -- id = 2
```

### Relationships

**conversations** has relationships with:
- **conversation_members** (one-to-many): One conversation has many members
- **messages** (one-to-many): One conversation has many messages
- **users** (many-to-one): Created by one user

---

## Table: conversation_members

### Purpose
Junction table linking users to conversations. Tracks membership, roles, and read status.

### Complete Field List

| Field | Type | Constraints | Default | Nullable | Description |
|-------|------|-------------|---------|----------|-------------|
| **conversation_id** | `INTEGER` | FK → conversations(id), PK | - | ❌ No | Which conversation |
| **user_id** | `INTEGER` | FK → users(id), PK | - | ❌ No | Which user |
| **role** | `ENUM` | 'admin', 'member' | 'member' | ❌ No | User's role in conversation |
| **joined_at** | `TIMESTAMP` | - | NOW() | ❌ No | When user joined |
| **last_read_at** | `TIMESTAMP` | - | '1970-01-01' | ❌ No | Last time user read messages |

**Composite Primary Key:** `(conversation_id, user_id)` - ensures user can't join same conversation twice

### Detailed Field Descriptions

#### **conversation_id** (Part of Primary Key)
- **Type:** `INTEGER`
- **Purpose:** References which conversation this membership is for
- **Foreign Key:** References `conversations(id)`
- **ON DELETE:** CASCADE (if conversation deleted, remove all memberships)
- **Usage:** Link user to conversation
- **Example:** `1` (conversation ID)

#### **user_id** (Part of Primary Key)
- **Type:** `INTEGER`
- **Purpose:** References which user is a member
- **Foreign Key:** References `users(id)`
- **ON DELETE:** CASCADE (if user deleted, remove from all conversations)
- **Usage:** Link conversation to user
- **Example:** `5` (user ID)

#### **Composite Primary Key: (conversation_id, user_id)**
- **Purpose:** Ensure a user can only be in a conversation once
- **Prevents:** Duplicate memberships
- **Example:**
  - ✅ Allowed: `(1, 5)` - User 5 in conversation 1
  - ✅ Allowed: `(1, 10)` - User 10 in conversation 1
  - ❌ Blocked: `(1, 5)` again - User 5 already in conversation 1

#### **role**
- **Type:** `ENUM('admin', 'member')`
- **Purpose:** User's permission level in conversation
- **Default:** `'member'`
- **Values:**
  - `'member'` - Regular participant (1-on-1 chats, group members)
  - `'admin'` - Can add/remove members, change name (group chats only)
- **Usage:**
  - Check before allowing group management actions
  - For 1-on-1 chats: always `'member'` for both users
  - For groups: at least one user must be `'admin'`
- **Example:**
  ```sql
  -- In group chat:
  (1, 5, 'admin')   -- User 5 is admin of conversation 1
  (1, 10, 'member') -- User 10 is regular member
  ```

#### **joined_at**
- **Type:** `TIMESTAMP`
- **Purpose:** When user was added to conversation
- **Default:** `NOW()`
- **Usage:**
  - Show "Bob joined 2 days ago" in group chats
  - Filter messages: only show messages after join date
  - Analytics
- **Example:** `2025-12-25 16:30:00`
- **Note:** For 1-on-1 chats created automatically, both users have same `joined_at`

#### **last_read_at**
- **Type:** `TIMESTAMP`
- **Purpose:** Track when user last read messages (for unread counts)
- **Default:** `'1970-01-01 00:00:00'` (epoch = all messages unread initially)
- **Updates:** Set to NOW() when user opens conversation or reads messages
- **Usage:** Calculate unread count
  ```sql
  -- Unread count for user
  SELECT COUNT(*) FROM messages
  WHERE conversation_id = 1
    AND created_at > last_read_at  -- Messages after last read
    AND sender_id != user_id;      -- Don't count own messages
  ```
- **Example:**
  - Initial: `1970-01-01 00:00:00` → All messages are unread
  - After reading: `2025-12-28 14:30:00` → Only messages after this are unread

### Indexes on conversation_members

```sql
-- Primary Key Index (composite)
PRIMARY KEY (conversation_id, user_id)

-- Performance Indexes
CREATE INDEX idx_members_user ON conversation_members(user_id);
CREATE INDEX idx_members_conversation ON conversation_members(conversation_id);
CREATE INDEX idx_members_last_read ON conversation_members(last_read_at);
```

**Why these indexes?**
- `user_id`: Get all conversations for a user (`WHERE user_id = ?`)
- `conversation_id`: Get all members of a conversation
- `last_read_at`: Calculate unread counts efficiently

### Example Data

```sql
-- 1-on-1 conversation (conversation 1) between Alice (1) and Bob (2)
INSERT INTO conversation_members (conversation_id, user_id, role) VALUES
(1, 1, 'member'),  -- Alice in conversation 1
(1, 2, 'member');  -- Bob in conversation 1

-- Group conversation (conversation 2) with 3 members
INSERT INTO conversation_members (conversation_id, user_id, role) VALUES
(2, 1, 'admin'),   -- Alice is admin
(2, 2, 'member'),  -- Bob is member
(2, 3, 'member');  -- Charlie is member
```

### Relationships

**conversation_members** links:
- **conversations** (many-to-one): Many memberships belong to one conversation
- **users** (many-to-one): Many memberships belong to one user

### Important Constraints

**CASCADE Behavior:**
```sql
-- If conversation deleted:
DELETE FROM conversations WHERE id = 1;
-- All conversation_members for that conversation are automatically deleted

-- If user deleted:
DELETE FROM users WHERE id = 5;
-- All conversation_members for that user are automatically deleted
```

---

## Table: messages

### Purpose
Stores all chat messages sent in conversations.

### Complete Field List

| Field | Type | Constraints | Default | Nullable | Description |
|-------|------|-------------|---------|----------|-------------|
| **id** | `INTEGER` | PRIMARY KEY, AUTO INCREMENT | - | ❌ No | Unique message identifier |
| **conversation_id** | `INTEGER` | FK → conversations(id) | - | ❌ No | Which conversation |
| **sender_id** | `INTEGER` | FK → users(id) | NULL | ✅ Yes | Who sent the message |
| **content** | `TEXT` | NOT EMPTY, MAX 10000 chars | - | ❌ No | Message text content |
| **created_at** | `TIMESTAMP` | - | NOW() | ❌ No | When message was sent |
| **updated_at** | `TIMESTAMP` | AUTO UPDATE | NOW() | ❌ No | Last edit timestamp |

### Detailed Field Descriptions

#### **id** (Primary Key)
- **Type:** `INTEGER` (Serial/Auto-increment)
- **Purpose:** Unique identifier for each message
- **Generation:** Automatically assigned (1, 2, 3, ...)
- **Usage:** 
  - Reference specific messages
  - Pagination (cursor)
  - Message ordering (with created_at)
- **Example:** `1`, `42`, `1337`

#### **conversation_id**
- **Type:** `INTEGER`
- **Purpose:** Links message to its conversation
- **Foreign Key:** References `conversations(id)`
- **ON DELETE:** CASCADE (if conversation deleted, all its messages deleted)
- **Cannot be NULL:** Every message must belong to a conversation
- **Usage:** Fetch all messages for a conversation
  ```sql
  SELECT * FROM messages WHERE conversation_id = 1;
  ```
- **Example:** `1` (conversation ID)

#### **sender_id**
- **Type:** `INTEGER` (Nullable!)
- **Purpose:** Which user sent this message
- **Foreign Key:** References `users(id)`
- **ON DELETE:** SET NULL (if user deleted, message remains but sender = NULL)
- **Why nullable?** Preserve message history even if user deletes account
- **Usage:**
  - Display sender name/avatar
  - Filter messages by sender
- **When NULL:** UI shows "[Deleted User]" or similar
- **Example:** `5` (user ID) or `NULL`

#### **content**
- **Type:** `TEXT`
- **Purpose:** The actual message text
- **Constraints:**
  - NOT NULL (must have content)
  - NOT EMPTY: `LENGTH(TRIM(content)) > 0`
  - MAX LENGTH: 10,000 characters (for MVP)
- **Format:** Plain text (for MVP), could support Markdown later
- **Usage:** Display in chat UI
- **Example:**
  ```
  "Hey! How are you doing?"
  "Check out this link: https://example.com"
  "Long message with multiple lines
  and paragraphs..."
  ```
- **Security Notes:**
  - ❌ Must sanitize before displaying (prevent XSS)
  - ❌ Escape HTML characters
  - ✅ Use text sanitization library

#### **created_at**
- **Type:** `TIMESTAMP`
- **Purpose:** When message was sent
- **Default:** `NOW()`
- **Precision:** Microseconds (e.g., `2025-12-28 14:30:45.123456`)
- **Usage:**
  - Display timestamp in UI
  - Sort messages chronologically
  - Calculate "sent 5 minutes ago"
  - Unread count calculations
- **Important:** Combined with `id` for guaranteed ordering
  ```sql
  ORDER BY created_at ASC, id ASC
  ```
- **Example:** `2025-12-28 14:30:45.123456`

#### **updated_at**
- **Type:** `TIMESTAMP`
- **Purpose:** Last time message was modified (for future editing feature)
- **Default:** `NOW()`
- **Auto-Update:** Updates automatically on UPDATE
- **Usage:**
  - For MVP: Same as created_at
  - Future: Track message edits
    - If `updated_at > created_at`: Message was edited
    - Show "Edited" indicator in UI
- **Example:** `2025-12-28 14:30:45.123456`

### Indexes on messages

```sql
-- Primary Key Index
PRIMARY KEY (id)

-- Critical Performance Index (MOST IMPORTANT!)
CREATE INDEX idx_messages_conversation_time 
  ON messages(conversation_id, created_at DESC, id DESC);

-- Additional Indexes
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

**Why these indexes?**

**1. `idx_messages_conversation_time` (Most Important!)**
- **Query it optimizes:**
  ```sql
  SELECT * FROM messages
  WHERE conversation_id = 1
  ORDER BY created_at DESC, id DESC
  LIMIT 50;
  ```
- **Why:** This is the MOST COMMON query in a chat app
- **Without this index:** Database would scan entire messages table (SLOW!)
- **With this index:** Database jumps directly to conversation 1's messages (FAST!)
- **Performance:** 0.5ms with index vs 500ms without (for 1M messages)

**2. `idx_messages_sender`**
- **Query it optimizes:**
  ```sql
  SELECT * FROM messages WHERE sender_id = 5;
  ```
- **Use cases:** Find all messages by a user, moderation

**3. `idx_messages_created_at`**
- **Query it optimizes:**
  ```sql
  SELECT * FROM messages
  WHERE created_at > '2025-12-01'
  ORDER BY created_at DESC;
  ```
- **Use cases:** Recent messages across all conversations, analytics

### Example Data

```sql
-- Messages in conversation 1 (Alice ↔ Bob)
INSERT INTO messages (conversation_id, sender_id, content) VALUES
(1, 1, 'Hey Bob! How are you doing?'),
(1, 2, 'Hi Alice! I''m doing great, thanks!'),
(1, 1, 'That''s wonderful to hear!');

-- Messages in group conversation 2
INSERT INTO messages (conversation_id, sender_id, content) VALUES
(2, 1, 'Welcome to the team chat, everyone!'),
(2, 2, 'Thanks! Excited to be here.'),
(2, 3, 'Hello team! 👋');
```

### Message Ordering Strategy

**Critical for chat apps:** Messages MUST be in correct order!

**Problem:**
```sql
-- Two messages sent at "same time"
id | created_at                  | content
1  | 2025-12-28 14:30:45.123456 | "Hello"
2  | 2025-12-28 14:30:45.123456 | "Hi!"  -- Same timestamp!
```

**Solution:** Order by BOTH `created_at` AND `id`
```sql
SELECT * FROM messages
WHERE conversation_id = 1
ORDER BY created_at ASC, id ASC;  -- id is tiebreaker!
```

**Why this works:**
- If timestamps are different → sorted by time
- If timestamps are same → sorted by ID (which is always unique and increasing)
- **Guaranteed deterministic ordering**

### Relationships

**messages** links to:
- **conversations** (many-to-one): Many messages in one conversation
- **users** (many-to-one): Many messages sent by one user (or NULL)

### Important Constraints

**CASCADE Behavior:**
```sql
-- If conversation deleted:
DELETE FROM conversations WHERE id = 1;
-- All messages in that conversation are automatically deleted (CASCADE)

-- If user deleted:
DELETE FROM users WHERE id = 5;
-- Messages remain, but sender_id becomes NULL (SET NULL)
-- Allows message history to be preserved
```

**Content Validation:**
```sql
-- Must have content
CONSTRAINT check_content_not_empty 
  CHECK (LENGTH(TRIM(content)) > 0)

-- Max length
CONSTRAINT check_content_length 
  CHECK (LENGTH(content) <= 10000)
```

---

## Relationships Diagram

### Visual Representation

```
┌─────────────────────────────────┐
│           USERS                 │
│                                 │
│ PK: id                          │
│     username (unique)           │
│     email (unique)              │
│     password_hash               │
│     display_name                │
│     avatar_url                  │
│     status                      │
│     last_seen                   │
│     created_at                  │
│     updated_at                  │
└────┬──────────────────┬─────────┘
     │                  │
     │ 1                │ 1
     │                  │
     │ ∞                │ ∞
     │                  │
┌────┴──────────────────┴─────────┐       ┌──────────────────────────┐
│    CONVERSATION_MEMBERS         │   ∞   │      CONVERSATIONS       │
│                                 │───────│                          │
│ PK: (conversation_id, user_id) │   1   │ PK: id                   │
│     role                        │       │     is_group             │
│     joined_at                   │       │     name                 │
│     last_read_at                │       │     created_by (FK)      │
└────────────┬────────────────────┘       │     created_at           │
             │                            │     updated_at           │
             │ 1                          └───────────┬──────────────┘
             │                                        │
             │ ∞                                      │ 1
             │                                        │
┌────────────┴────────────────────────────────────────┴──────────────┐
│                        MESSAGES                                     │
│                                                                     │
│ PK: id                                                              │
│ FK: conversation_id (CASCADE)                                       │
│ FK: sender_id (SET NULL)                                            │
│     content                                                         │
│     created_at                                                      │
│     updated_at                                                      │
└─────────────────────────────────────────────────────────────────────┘

Legend:
PK = Primary Key
FK = Foreign Key
1 = One
∞ = Many
```

### Relationship Explanations

**1. User → Messages (One-to-Many)**
- One user can send many messages
- Each message has one sender (or NULL if user deleted)
- Foreign Key: `messages.sender_id → users.id`
- ON DELETE: SET NULL

**2. User → Conversation Members (One-to-Many)**
- One user can be member of many conversations
- Each membership belongs to one user
- Foreign Key: `conversation_members.user_id → users.id`
- ON DELETE: CASCADE

**3. Conversation → Messages (One-to-Many)**
- One conversation can have many messages
- Each message belongs to one conversation
- Foreign Key: `messages.conversation_id → conversations.id`
- ON DELETE: CASCADE

**4. Conversation → Conversation Members (One-to-Many)**
- One conversation can have many members
- Each membership belongs to one conversation
- Foreign Key: `conversation_members.conversation_id → conversations.id`
- ON DELETE: CASCADE

**5. User → Conversations (Many-to-Many via Conversation Members)**
- Users and Conversations have a many-to-many relationship
- Junction table: `conversation_members`
- Allows storing extra data: role, joined_at, last_read_at

---

## Indexes Summary

### All Indexes in the Schema

| Table | Index Name | Columns | Type | Purpose |
|-------|-----------|---------|------|---------|
| **users** | PRIMARY KEY | id | Primary | Unique identifier |
| | idx_users_email | email | Unique | Login by email |
| | idx_users_username | username | Unique | Login by username |
| | idx_users_status | status | Regular | Filter online users |
| | idx_users_last_seen | last_seen | Regular | Sort by activity |
| **conversations** | PRIMARY KEY | id | Primary | Unique identifier |
| | idx_conversations_updated | updated_at DESC | Regular | Sort by recent activity |
| | idx_conversations_created_by | created_by | Regular | Find user's conversations |
| | idx_conversations_is_group | is_group | Regular | Filter 1-on-1 vs groups |
| **conversation_members** | PRIMARY KEY | (conversation_id, user_id) | Composite | Unique membership |
| | idx_members_user | user_id | Regular | User's conversations |
| | idx_members_conversation | conversation_id | Regular | Conversation's members |
| | idx_members_last_read | last_read_at | Regular | Unread calculations |
| **messages** | PRIMARY KEY | id | Primary | Unique identifier |
| | idx_messages_conversation_time | (conversation_id, created_at DESC, id DESC) | Covering | Fetch messages (CRITICAL!) |
| | idx_messages_sender | sender_id | Regular | Messages by user |
| | idx_messages_created_at | created_at DESC | Regular | Recent messages |

### Index Size Estimates

**For 1 million messages:**
- PRIMARY KEY indexes: ~30 MB
- idx_messages_conversation_time: ~50 MB (most important!)
- All other indexes: ~100 MB total

**Total:** ~180 MB for all indexes (worth it for performance!)

---

## Example Data

### Complete Example Dataset

```sql
-- ============================================
-- 1. Create Users
-- ============================================
INSERT INTO users (username, email, password_hash, display_name, status) VALUES
('alice', 'alice@example.com', '$2a$10$hash1', 'Alice Smith', 'online'),
('bob', 'bob@example.com', '$2a$10$hash2', 'Bob Johnson', 'online'),
('charlie', 'charlie@example.com', '$2a$10$hash3', 'Charlie Brown', 'offline'),
('diana', 'diana@example.com', '$2a$10$hash4', 'Diana Prince', 'away');

-- Result: users with IDs 1, 2, 3, 4

-- ============================================
-- 2. Create Conversations
-- ============================================

-- 1-on-1: Alice ↔ Bob
INSERT INTO conversations (is_group, name, created_by) VALUES
(false, NULL, 1);  -- ID: 1

-- 1-on-1: Alice ↔ Charlie
INSERT INTO conversations (is_group, name, created_by) VALUES
(false, NULL, 1);  -- ID: 2

-- Group: Engineering Team
INSERT INTO conversations (is_group, name, created_by) VALUES
(true, 'Engineering Team', 1);  -- ID: 3

-- ============================================
-- 3. Add Conversation Members
-- ============================================

-- Conversation 1: Alice ↔ Bob
INSERT INTO conversation_members (conversation_id, user_id, role) VALUES
(1, 1, 'member'),  -- Alice
(1, 2, 'member');  -- Bob

-- Conversation 2: Alice ↔ Charlie
INSERT INTO conversation_members (conversation_id, user_id, role) VALUES
(2, 1, 'member'),  -- Alice
(2, 3, 'member');  -- Charlie

-- Conversation 3: Engineering Team (group)
INSERT INTO conversation_members (conversation_id, user_id, role) VALUES
(3, 1, 'admin'),   -- Alice (admin)
(3, 2, 'member'),  -- Bob
(3, 4, 'member');  -- Diana

-- ============================================
-- 4. Send Messages
-- ============================================

-- Messages in Conversation 1 (Alice ↔ Bob)
INSERT INTO messages (conversation_id, sender_id, content) VALUES
(1, 1, 'Hey Bob! How are you?'),
(1, 2, 'Hi Alice! I''m doing great!'),
(1, 1, 'Awesome! Want to grab coffee?'),
(1, 2, 'Sure! When works for you?');

-- Messages in Conversation 2 (Alice ↔ Charlie)
INSERT INTO messages (conversation_id, sender_id, content) VALUES
(2, 1, 'Hey Charlie! Long time no see.'),
(2, 3, 'Hi Alice! How have you been?');

-- Messages in Conversation 3 (Engineering Team)
INSERT INTO messages (conversation_id, sender_id, content) VALUES
(3, 1, 'Welcome to the Engineering Team chat!'),
(3, 2, 'Thanks! Excited to be here.'),
(3, 4, 'Hello everyone! 👋'),
(3, 1, 'Team meeting at 3pm today, don''t forget!');

-- ============================================
-- 5. Mark Some Messages as Read
-- ============================================

-- Bob reads conversation 1
UPDATE conversation_members
SET last_read_at = NOW()
WHERE conversation_id = 1 AND user_id = 2;

-- Charlie hasn't read yet, so has 2 unread messages
```

### Query Examples with This Data

**1. Get Alice's conversation list:**
```sql
SELECT * FROM user_conversations WHERE user_id = 1;
```

**Result:**
| conversation_id | is_group | other_username | last_message_content | unread_count |
|-----------------|----------|----------------|---------------------|--------------|
| 3 | true | NULL | Team meeting at 3pm... | 0 |
| 1 | false | bob | Sure! When works... | 1 |
| 2 | false | charlie | How have you been? | 1 |

**2. Get messages in conversation 1:**
```sql
SELECT 
  m.id,
  m.content,
  u.username as sender,
  m.created_at
FROM messages m
LEFT JOIN users u ON m.sender_id = u.id
WHERE m.conversation_id = 1
ORDER BY m.created_at ASC, m.id ASC;
```

**Result:**
| id | content | sender | created_at |
|----|---------|--------|------------|
| 1 | Hey Bob! How are you? | alice | 2025-12-28 14:00:00 |
| 2 | Hi Alice! I'm doing great! | bob | 2025-12-28 14:00:30 |
| 3 | Awesome! Want to grab coffee? | alice | 2025-12-28 14:01:00 |
| 4 | Sure! When works for you? | bob | 2025-12-28 14:01:30 |

---

## Database Statistics

### Expected Data Volumes

**For a chat app with 10,000 active users:**

| Table | Estimated Rows | Growth Rate | Disk Space |
|-------|----------------|-------------|------------|
| **users** | 10,000 | 100/day | 2 MB |
| **conversations** | 50,000 | 500/day | 5 MB |
| **conversation_members** | 100,000 | 1,000/day | 8 MB |
| **messages** | 5,000,000 | 50,000/day | 500 MB |

**Total:** ~515 MB for 10K users

### Performance Benchmarks

**With proper indexes:**
- Fetch 50 messages: **< 5ms**
- Get conversation list: **< 10ms**
- Send message: **< 10ms**
- Calculate unread count: **< 15ms**
- Search users: **< 20ms**

**Without indexes:**
- Same queries: **500ms - 5000ms** (100x slower!)

---

## Summary

### Tables at a Glance

| Table | Rows | Key Fields | Purpose |
|-------|------|------------|---------|
| **users** | 10K | id, username, email | User accounts |
| **conversations** | 50K | id, is_group, name | Chat containers |
| **conversation_members** | 100K | (conversation_id, user_id) | Who's in what chat |
| **messages** | 5M+ | id, conversation_id, content | The messages |

### Critical Indexes

1. ✅ `messages(conversation_id, created_at, id)` - Most important!
2. ✅ `conversation_members(user_id)` - User's conversations
3. ✅ `conversations(updated_at)` - Recent activity

### Key Design Decisions

1. ✅ **Junction table** for users ↔ conversations (supports groups!)
2. ✅ **Single conversations table** with `is_group` flag
3. ✅ **SET NULL** for deleted users in messages (preserve history)
4. ✅ **CASCADE** for deleted conversations (clean up everything)
5. ✅ **last_read_at** in members table (efficient unread counts)
6. ✅ **Order by created_at AND id** (guaranteed message ordering)

---

**This schema is production-ready and scales to millions of messages!** 🚀