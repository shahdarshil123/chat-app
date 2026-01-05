/*
  Warnings:

  - A unique constraint covering the columns `[last_message_id]` on the table `conversations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "conversation_members" ALTER COLUMN "last_read_at" SET DEFAULT '1970-01-01 00:00:00'::timestamp;

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "last_message_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "conversations_last_message_id_key" ON "conversations"("last_message_id");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_last_message_id_fkey" FOREIGN KEY ("last_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
