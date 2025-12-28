import {PrismaClient} from '@prisma/client';
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