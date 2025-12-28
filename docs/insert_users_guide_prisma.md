# Insert Users to PostgreSQL - Complete Guide

## Multiple ways to add users to your chat application database with Prisma

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Method 1: Simple Insert Script](#method-1-simple-insert-script)
3. [Method 2: Prisma Seed](#method-2-prisma-seed-recommended)
4. [Method 3: Production Version with bcrypt](#method-3-production-version-with-bcrypt)
5. [Method 4: Prisma Studio GUI](#method-4-prisma-studio-gui)
6. [Method 5: Single User Insert](#method-5-single-user-insert)
7. [Verify Users](#verify-users)
8. [Update Existing Users](#update-existing-users)
9. [Delete Users](#delete-users)

---

## Quick Start

### Fastest Way (3 Steps)

```bash
# 1. Create scripts folder
mkdir server/scripts

# 2. Save insert-users.js script to server/scripts/

# 3. Run it
cd server
node scripts/insert-users.js
```

**Done! 5 users added.**

---

## Method 1: Simple Insert Script

### Save Script to `server/scripts/insert-users.js`

I've created the complete script for you above. It includes:
- ✅ 5 pre-defined users
- ✅ Password hashing
- ✅ Avatar URLs
- ✅ Different statuses
- ✅ Skips duplicates
- ✅ Pretty output

### Run the Script

```bash
cd server
node scripts/insert-users.js
```

### What It Does

1. **Connects to database** via Prisma
2. **Checks for existing users** (won't duplicate)
3. **Inserts 5 users:**
   - Alice (online)
   - Bob (online)
   - Charlie (offline)
   - Diana (away)
   - Eve (offline)
4. **Shows summary** with pretty table
5. **Suggests next steps**

### Customize Users

Edit the `usersToInsert` array in the script:

```javascript
const usersToInsert = [
  {
    username: 'your_username',
    email: 'your@email.com',
    password: 'your_password',
    displayName: 'Your Name',
    avatarUrl: 'https://your-avatar-url.com/image.jpg',
    status: 'online',
  },
  // Add more users...
];
```

---

## Method 2: Prisma Seed (Recommended)

### What is Prisma Seed?

Prisma's official way to populate your database with initial data.

**Benefits:**
- ✅ Run automatically with `npx prisma db seed`
- ✅ Run on `npx prisma migrate reset`
- ✅ Standard Prisma feature
- ✅ Entire team uses same data

### Step 1: Create Seed File

**Create `server/prisma/seed.js`:**

```javascript
import { PrismaClient } from './generated/client/index.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Seeding database...');
  
  // Insert users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      username: 'alice',
      email: 'alice@example.com',
      passwordHash: hashPassword('password123'),
      displayName: 'Alice Smith',
      status: 'online',
    },
  });
  
  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      username: 'bob',
      email: 'bob@example.com',
      passwordHash: hashPassword('password123'),
      displayName: 'Bob Johnson',
      status: 'online',
    },
  });
  
  console.log('✅ Seeded users:', alice.username, bob.username);
  
  // Create conversation (optional)
  const conversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      createdBy: alice.id,
      members: {
        create: [
          { userId: alice.id },
          { userId: bob.id },
        ],
      },
      messages: {
        create: [
          {
            senderId: alice.id,
            content: 'Hey Bob!',
          },
          {
            senderId: bob.id,
            content: 'Hi Alice!',
          },
        ],
      },
    },
  });
  
  console.log('✅ Seeded conversation:', conversation.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Step 2: Configure package.json

**Add to `server/package.json`:**

```json
{
  "prisma": {
    "seed": "node prisma/seed.js"
  }
}
```

### Step 3: Run Seed

```bash
npx prisma db seed
```

**Or reset and seed:**
```bash
npx prisma migrate reset
# This will:
# 1. Drop database
# 2. Run all migrations
# 3. Run seed script
```

---

## Method 3: Production Version with bcrypt

### Why bcrypt?

**Current script uses:** Simple SHA-256 hashing (fast but less secure)  
**Production needs:** bcrypt or Argon2 (slow but very secure)

### Step 1: Install bcrypt

```bash
npm install bcrypt
```

### Step 2: Create Production Script

**Create `server/scripts/insert-users-production.js`:**

```javascript
import { PrismaClient } from '../prisma/generated/client/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Secure password hashing with bcrypt
async function hashPassword(password) {
  return await bcrypt.hash(password, 10); // Cost factor: 10
}

async function insertUsers() {
  console.log('🚀 Inserting users with bcrypt...\n');
  
  const users = [
    {
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123',
      displayName: 'Alice Smith',
    },
    {
      username: 'bob',
      email: 'bob@example.com',
      password: 'password123',
      displayName: 'Bob Johnson',
    },
  ];
  
  for (const userData of users) {
    try {
      // Hash password securely
      const passwordHash = await hashPassword(userData.password);
      
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          passwordHash: passwordHash,
          displayName: userData.displayName,
          status: 'offline',
        },
      });
      
      console.log(`✅ Created: ${user.username} (ID: ${user.id})`);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⏭️  Skipped: ${userData.username} (exists)`);
      } else {
        console.error(`❌ Error: ${error.message}`);
      }
    }
  }
  
  await prisma.$disconnect();
  console.log('\n✅ Complete!');
}

insertUsers();
```

**Run:**
```bash
node scripts/insert-users-production.js
```

**Note:** bcrypt is slower (intentionally for security) - takes ~100ms per user.

---

## Method 4: Prisma Studio (GUI)

### Insert Users Visually

**Step 1: Open Prisma Studio**
```bash
npx prisma studio
```

**Step 2: Add User Manually**

1. Click **"User"** in left sidebar
2. Click **"Add record"** button
3. Fill in form:
   ```
   username: john
   email: john@example.com
   passwordHash: (paste hashed password)
   displayName: John Doe
   status: online
   ```
4. Click **"Save 1 change"**

**Note:** You'll need to hash password separately (see below)

### Generate Password Hash

**Create `server/scripts/hash-password.js`:**

```javascript
import crypto from 'crypto';
// Or: import bcrypt from 'bcrypt';

const password = process.argv[2] || 'password123';

// Simple hash
const hash = crypto.createHash('sha256').update(password).digest('hex');

// Or with bcrypt (install first: npm install bcrypt)
// const hash = await bcrypt.hash(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
```

**Use:**
```bash
node scripts/hash-password.js mypassword

# Output:
# Password: mypassword
# Hash: 89e01536ac207279409d4de1e5253e01f4a1769e696db0d6062ca9b8f56767c8
```

Copy hash, paste into Prisma Studio.

---

## Method 5: Single User Insert

### Insert One User at a Time

**Create `server/scripts/add-user.js`:**

```javascript
import { PrismaClient } from '../prisma/generated/client/index.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Get data from command line arguments
const username = process.argv[2];
const email = process.argv[3];
const password = process.argv[4] || 'password123';
const displayName = process.argv[5];

if (!username || !email) {
  console.log('Usage: node add-user.js <username> <email> [password] [displayName]');
  console.log('Example: node add-user.js john john@example.com password123 "John Doe"');
  process.exit(1);
}

async function addUser() {
  try {
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        displayName: displayName || username,
        status: 'offline',
      },
    });
    
    console.log('✅ User created successfully!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Display Name: ${user.displayName}`);
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.error('❌ Error: User already exists (duplicate username or email)');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

addUser();
```

**Save to:** `server/scripts/add-user.js`

**Usage:**
```bash
# Add user with all fields
node scripts/add-user.js john john@example.com mypassword "John Doe"

# Minimal (password and displayName are optional)
node scripts/add-user.js jane jane@example.com

# Output:
✅ User created successfully!
   ID: 6
   Username: john
   Email: john@example.com
   Display Name: John Doe
```

---

## Verify Users

### Option 1: Prisma Studio (Visual)

```bash
npx prisma studio
```

Click "User" table → See all users

### Option 2: Check Script

**Create `server/scripts/list-users.js`:**

```javascript
import { PrismaClient } from '../prisma/generated/client/index.js';

const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { id: 'asc' },
  });
  
  console.log(`\n👥 Total Users: ${users.length}\n`);
  
  console.log('┌────┬──────────┬─────────────────────────┬──────────────────┬─────────┐');
  console.log('│ ID │ Username │ Email                   │ Display Name     │ Status  │');
  console.log('├────┼──────────┼─────────────────────────┼──────────────────┼─────────┤');
  
  users.forEach(u => {
    const id = String(u.id).padEnd(2);
    const username = u.username.padEnd(8);
    const email = u.email.padEnd(23);
    const displayName = (u.displayName || '').padEnd(16);
    const status = u.status.padEnd(7);
    console.log(`│ ${id} │ ${username} │ ${email} │ ${displayName} │ ${status} │`);
  });
  
  console.log('└────┴──────────┴─────────────────────────┴──────────────────┴─────────┘\n');
  
  await prisma.$disconnect();
}

listUsers();
```

**Run:**
```bash
node scripts/list-users.js
```

### Option 3: PostgreSQL Command Line

```bash
psql -d chatapp -c "SELECT id, username, email, display_name, status FROM users;"
```

**Output:**
```
 id | username |      email           | display_name  | status
----+----------+----------------------+---------------+--------
  1 | alice    | alice@example.com    | Alice Smith   | online
  2 | bob      | bob@example.com      | Bob Johnson   | online
  3 | charlie  | charlie@example.com  | Charlie Brown | offline
```

### Option 4: In Your Application

**Add to `src/db/users.js`:**

```javascript
import prisma from './prisma.js';

export async function getAllUsers() {
  return await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}
```

**Use in code:**
```javascript
import { getAllUsers } from './db/users.js';

const users = await getAllUsers();
console.log(users);
```

---

## Update Existing Users

### Update Single User

```javascript
import { PrismaClient } from './prisma/generated/client/index.js';

const prisma = new PrismaClient();

// Update user status
await prisma.user.update({
  where: { id: 1 },
  data: { 
    status: 'online',
    lastSeen: new Date(),
  },
});

// Update user profile
await prisma.user.update({
  where: { email: 'alice@example.com' },
  data: {
    displayName: 'Alice M. Smith',
    avatarUrl: 'https://new-avatar-url.com/alice.jpg',
  },
});

await prisma.$disconnect();
```

### Update Multiple Users

```javascript
// Set all users to offline
await prisma.user.updateMany({
  data: {
    status: 'offline',
  },
});

// Update specific users
await prisma.user.updateMany({
  where: {
    status: 'away',
  },
  data: {
    status: 'offline',
  },
});
```

---

## Delete Users

### Delete Single User

```javascript
import { PrismaClient } from './prisma/generated/client/index.js';

const prisma = new PrismaClient();

// Delete by ID
await prisma.user.delete({
  where: { id: 5 },
});

// Delete by email
await prisma.user.delete({
  where: { email: 'eve@example.com' },
});

await prisma.$disconnect();
```

**⚠️ What happens (based on your schema):**
- Messages from this user: `sender_id` becomes NULL (preserved)
- Conversation memberships: Deleted (CASCADE)

### Delete All Users (Careful!)

```javascript
// Delete ALL users
await prisma.user.deleteMany();

// This also deletes (CASCADE):
// - All conversation_members
// - Sets all message sender_ids to NULL
```

---

## Production-Ready Version with bcrypt

### Install bcrypt

```bash
npm install bcrypt
```

### Create Production Insert Script

**Create `server/scripts/insert-users-secure.js`:**

```javascript
import { PrismaClient } from '../prisma/generated/client/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Secure password hashing
async function hashPassword(password) {
  // Cost factor 10 = ~100ms per hash (good balance)
  return await bcrypt.hash(password, 10);
}

async function insertUsers() {
  console.log('🚀 Inserting users with bcrypt hashing...\n');
  console.log('⏳ This may take a moment (bcrypt is intentionally slow for security)\n');
  
  const users = [
    {
      username: 'alice',
      email: 'alice@example.com',
      password: 'SecurePassword123!',
      displayName: 'Alice Smith',
    },
    {
      username: 'bob',
      email: 'bob@example.com',
      password: 'SecurePassword456!',
      displayName: 'Bob Johnson',
    },
    {
      username: 'charlie',
      email: 'charlie@example.com',
      password: 'SecurePassword789!',
      displayName: 'Charlie Brown',
    },
  ];
  
  for (const userData of users) {
    try {
      console.log(`Hashing password for ${userData.username}...`);
      const passwordHash = await hashPassword(userData.password);
      
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          passwordHash: passwordHash,
          displayName: userData.displayName,
          status: 'offline',
        },
      });
      
      console.log(`✅ Created: ${user.username} (ID: ${user.id})\n`);
      
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⏭️  Skipped: ${userData.username} (already exists)\n`);
      } else {
        console.error(`❌ Error creating ${userData.username}:`, error.message, '\n');
      }
    }
  }
  
  const totalUsers = await prisma.user.count();
  console.log(`\n👥 Total users in database: ${totalUsers}`);
  
  await prisma.$disconnect();
}

insertUsers();
```

**Run:**
```bash
node scripts/insert-users-secure.js
```

**Time:** ~300ms (bcrypt is intentionally slow for security)

---

## Bulk Insert (Many Users at Once)

### Create Many Users Efficiently

**Create `server/scripts/bulk-insert.js`:**

```javascript
import { PrismaClient } from '../prisma/generated/client/index.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function bulkInsert() {
  // Generate 100 test users
  const users = [];
  
  for (let i = 1; i <= 100; i++) {
    users.push({
      username: `user${i}`,
      email: `user${i}@example.com`,
      passwordHash: hashPassword('password123'),
      displayName: `User ${i}`,
      status: i % 3 === 0 ? 'online' : 'offline',
    });
  }
  
  console.log(`🚀 Bulk inserting ${users.length} users...\n`);
  
  try {
    const result = await prisma.user.createMany({
      data: users,
      skipDuplicates: true, // Skip if username/email exists
    });
    
    console.log(`✅ Inserted ${result.count} users`);
    
    const total = await prisma.user.count();
    console.log(`👥 Total users: ${total}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  await prisma.$disconnect();
}

bulkInsert();
```

**Run:**
```bash
node scripts/bulk-insert.js
```

**Benefits:**
- ⚡ Much faster than one-by-one
- ✅ Skips duplicates automatically
- 📊 Returns count of inserted records

---

## Practical Examples

### Example 1: Create Admin User

```javascript
import { PrismaClient } from './prisma/generated/client/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const admin = await prisma.user.create({
  data: {
    username: 'admin',
    email: 'admin@chatapp.com',
    passwordHash: await bcrypt.hash('AdminPassword123!', 10),
    displayName: 'System Admin',
    status: 'online',
  },
});

console.log('✅ Admin user created:', admin.id);
await prisma.$disconnect();
```

### Example 2: Import Users from CSV/JSON

**If you have users in JSON:**

```javascript
import { PrismaClient } from './prisma/generated/client/index.js';
import bcrypt from 'bcrypt';
import fs from 'fs';

const prisma = new PrismaClient();

// Read users from JSON file
const usersJson = JSON.parse(fs.readFileSync('./users.json', 'utf-8'));

for (const userData of usersJson) {
  const passwordHash = await bcrypt.hash(userData.password, 10);
  
  await prisma.user.create({
    data: {
      username: userData.username,
      email: userData.email,
      passwordHash,
      displayName: userData.displayName,
    },
  });
}

await prisma.$disconnect();
```

**users.json:**
```json
[
  {
    "username": "alice",
    "email": "alice@example.com",
    "password": "password123",
    "displayName": "Alice Smith"
  },
  {
    "username": "bob",
    "email": "bob@example.com",
    "password": "password123",
    "displayName": "Bob Johnson"
  }
]
```

---

## Troubleshooting

### Error: User already exists

**Error message:**
```
Unique constraint failed on the fields: (`email`)
```

**Solution:** User with that email already exists. Either:
1. Use different email
2. Delete existing user first
3. Use `upsert` instead of `create`

**Using upsert:**
```javascript
await prisma.user.upsert({
  where: { email: 'alice@example.com' },
  update: {
    displayName: 'Updated Name',
  },
  create: {
    username: 'alice',
    email: 'alice@example.com',
    passwordHash: hash,
    displayName: 'Alice Smith',
  },
});
// Creates if doesn't exist, updates if exists
```

### Error: Cannot find module

**Error:**
```
Cannot find module '../prisma/generated/client/index.js'
```

**Solution:**
```bash
# Generate Prisma Client first
npx prisma generate

# Verify it exists
ls prisma/generated/client/
```

### Error: Username too short

**Error from CHECK constraint:**
```
violates check constraint "check_username_length"
```

**Solution:** Username must be at least 3 characters (defined in schema)

---

## Summary

### All Methods to Insert Users

| Method | Difficulty | Best For | Speed |
|--------|-----------|----------|-------|
| **Insert Script** | Easy | Quick setup | Fast |
| **Prisma Seed** | Easy | Team consistency | Fast |
| **bcrypt Version** | Medium | Production | Slow (secure) |
| **Prisma Studio** | Very Easy | One-off additions | Manual |
| **Command Line** | Easy | Quick single user | Fast |

### Recommended Approach

**For Development:**
```bash
node scripts/insert-users.js
```

**For Production:**
```bash
# With bcrypt
node scripts/insert-users-secure.js
```

**For Team:**
```bash
# Use Prisma seed
npx prisma db seed
```

---

## Quick Commands Reference

```bash
# Run insert script
node scripts/insert-users.js

# Run Prisma seed
npx prisma db seed

# View users in GUI
npx prisma studio

# View users in terminal
node scripts/list-users.js

# Add single user
node scripts/add-user.js john john@example.com

# View in PostgreSQL
psql -d chatapp -c "SELECT * FROM users;"

# Count users
psql -d chatapp -c "SELECT COUNT(*) FROM users;"
```

---

## Next Steps

After inserting users, you can:

1. **Test login in your app**
   - Username: `alice`
   - Password: `password123`

2. **Create conversations between users**
   ```javascript
   const convId = await getOrCreateConversation(1, 2); // Alice + Bob
   ```

3. **Send test messages**
   ```javascript
   await saveMessage({
     conversationId: convId,
     senderId: 1,
     content: 'Test message!',
   });
   ```

4. **View in Prisma Studio**
   ```bash
   npx prisma studio
   ```

---

**You now have 5 different ways to insert users!** Choose the one that fits your workflow. For quick testing, use the insert script I created! 🚀

Would you like me to:
1. **Create a script to insert conversations** between users?
2. **Create a script to insert test messages**?
3. **Create a complete data seeder** (users + conversations + messages)?
4. **Show how to reset and reseed** the database?