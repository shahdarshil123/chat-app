# Prisma v7 Seeding & Configuration Debugging Guide

This document explains the issues encountered while setting up **Prisma v7** with a Node.js (ESM) backend and how they were resolved.

---

## Environment

- Node.js v22+
- Prisma v7.x
- PostgreSQL
- ESM project (`"type": "module"`)
- OS: Windows

---

## ❌ Problem Summary

Errors encountered during setup included:

- `Cannot find module '.prisma/client/default'`
- `PrismaClientInitializationError`
- `Unknown property datasources provided to PrismaClient constructor`
- `No seed command configured`
- `The datasource property url is no longer supported in schema files`

---

## 🔍 Root Causes & Fixes

### 1. Node modules installed in the wrong folder
- Prisma Client was installed at the project root instead of `server/`.

**Fix**
```bash
npm install --prefix server
```

---

### 2. Prisma Client not generated
```bash
npx prisma generate
```

---

### 3. Incorrect ESM import style
**Wrong**
```js
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
```

**Correct**
```js
import { PrismaClient } from "@prisma/client";
```

---

### 4. DATABASE_URL not available at runtime
```js
import "dotenv/config";
```

---

### 5. Prisma v7 removed `url` from schema.prisma
```prisma
datasource db {
  provider = "postgresql"
}
```

---

### 6. Seed config location changed in Prisma v7
```ts
migrations: {
  seed: "node prisma/seed.js"
}
```

---

### 7. `datasources` option removed from PrismaClient
Prisma v7 requires a **driver adapter**.

---

## ✅ Final Working Setup

### Install adapter
```bash
npm install @prisma/adapter-pg
```

### prisma.config.ts
```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
});
```

### schema.prisma
```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}
```

### prisma/seed.js
```js
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.create({
    data: {
      username: "testuser",
      email: "testuser@example.com",
      passwordHash: "dummy_hash",
      displayName: "Test User",
      status: "online",
    },
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 🧠 Key Takeaway

> Prisma v7 strictly separates schema, CLI config, and runtime configuration.
