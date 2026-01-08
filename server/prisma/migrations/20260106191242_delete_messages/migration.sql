-- AlterTable
ALTER TABLE "conversation_members" ALTER COLUMN "last_read_at" SET DEFAULT '1970-01-01 00:00:00'::timestamp;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "messages_deleted_at_idx" ON "messages"("deleted_at");
