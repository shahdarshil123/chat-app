/**
 * Prisma Seed Script – Full (Schema-Aligned, bcrypt)
 * --------------------------------------------------
 * Seeds:
 *  - Users
 *  - Direct conversations (1-on-1)
 *  - Group conversations
 *  - Messages
 *
 * Run:
 *   npx prisma db seed
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

// --------------------------------------------------
// Environment validation
// --------------------------------------------------
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is not defined");
}

// --------------------------------------------------
// Prisma Client (adapter required for Prisma v7)
// --------------------------------------------------
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

// --------------------------------------------------
// Password hashing helper (bcrypt)
// --------------------------------------------------
const SALT_ROUNDS = 10;

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// --------------------------------------------------
// Conversation helpers (schema-safe)
// --------------------------------------------------
async function getOrCreateDirectConversation(user1, user2) {
  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      members: {
        every: {
          userId: { in: [user1.id, user2.id] },
        },
      },
    },
    include: { members: true },
  });

  if (existing && existing.members.length === 2) {
    return existing;
  }

  return prisma.conversation.create({
    data: {
      isGroup: false,
      createdBy: user1.id,
      members: {
        create: [
          { userId: user1.id, role: "member" },
          { userId: user2.id, role: "member" },
        ],
      },
    },
  });
}

async function getOrCreateGroupConversation(name, creator, users) {
  const existing = await prisma.conversation.findFirst({
    where: { isGroup: true, name },
  });

  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      isGroup: true,
      name,
      createdBy: creator.id,
      members: {
        create: users.map((u) => ({
          userId: u.id,
          role: u.id === creator.id ? "admin" : "member",
        })),
      },
    },
  });
}

// --------------------------------------------------
// Main seed logic
// --------------------------------------------------
async function main() {
  console.log("🌱 Starting database seed...\n");

  // ===================== USERS =====================
  console.log("👥 Seeding users...");

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      username: "alice",
      email: "alice@example.com",
      passwordHash: await hashPassword("password123"),
      displayName: "Alice Smith",
      avatarUrl: "https://i.pravatar.cc/150?img=1",
      status: "online",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      username: "bob",
      email: "bob@example.com",
      passwordHash: await hashPassword("password123"),
      displayName: "Bob Johnson",
      avatarUrl: "https://i.pravatar.cc/150?img=2",
      status: "online",
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@example.com" },
    update: {},
    create: {
      username: "charlie",
      email: "charlie@example.com",
      passwordHash: await hashPassword("password123"),
      displayName: "Charlie Brown",
      avatarUrl: "https://i.pravatar.cc/150?img=3",
      status: "offline",
    },
  });

  const diana = await prisma.user.upsert({
    where: { email: "diana@example.com" },
    update: {},
    create: {
      username: "diana",
      email: "diana@example.com",
      passwordHash: await hashPassword("password123"),
      displayName: "Diana Prince",
      avatarUrl: "https://i.pravatar.cc/150?img=4",
      status: "away",
    },
  });

  console.log("  ✅ Users created\n");

  // ===================== CONVERSATIONS =====================
  console.log("💬 Seeding conversations...");

  const convAliceBob = await getOrCreateDirectConversation(alice, bob);
  const convAliceCharlie = await getOrCreateDirectConversation(
    alice,
    charlie
  );

  const engineeringTeam = await getOrCreateGroupConversation(
    "Engineering Team",
    alice,
    [alice, bob, diana]
  );

  console.log("  ✅ Conversations created\n");

  // ===================== MESSAGES =====================
  console.log("📝 Seeding messages...");

  await prisma.message.createMany({
    data: [
      {
        conversationId: convAliceBob.id,
        senderId: alice.id,
        content: "Hey Bob! How are you doing?",
      },
      {
        conversationId: convAliceBob.id,
        senderId: bob.id,
        content: "Hi Alice! I'm doing great, thanks!",
      },
      {
        conversationId: convAliceCharlie.id,
        senderId: alice.id,
        content: "Hey Charlie! Long time no see.",
      },
      {
        conversationId: convAliceCharlie.id,
        senderId: charlie.id,
        content: "Yeah! It's been a while 🙂",
      },
      {
        conversationId: engineeringTeam.id,
        senderId: alice.id,
        content: "Welcome to the Engineering Team channel!",
      },
      {
        conversationId: engineeringTeam.id,
        senderId: bob.id,
        content: "Glad to be here 🚀",
      },
    ],
    skipDuplicates: true,
  });

  console.log("  ✅ Messages created\n");

  // ===================== SUMMARY =====================
  const stats = {
    users: await prisma.user.count(),
    conversations: await prisma.conversation.count(),
    members: await prisma.conversationMember.count(),
    messages: await prisma.message.count(),
  };

  console.log("📊 Database Summary:");
  console.log(stats);

  console.log("\n🌱 Seed completed successfully");
}

// --------------------------------------------------
// Execute
// --------------------------------------------------
main()
  .catch((error) => {
    console.error("❌ Seeding failed");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🔌 Prisma disconnected");
  });
