/*
  Warnings:

  - A unique constraint covering the columns `[gcalEventId]` on the table `Event` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "gcalEventId" TEXT,
ADD COLUMN     "gcalUpdatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Event_gcalEventId_key" ON "Event"("gcalEventId");
