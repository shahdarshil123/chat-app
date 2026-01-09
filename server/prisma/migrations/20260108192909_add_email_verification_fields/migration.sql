-- AlterTable
ALTER TABLE "conversation_members" ALTER COLUMN "last_read_at" SET DEFAULT '1970-01-01 00:00:00'::timestamp;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);
