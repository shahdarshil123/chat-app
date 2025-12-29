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