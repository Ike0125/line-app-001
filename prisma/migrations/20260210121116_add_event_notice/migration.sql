-- CreateTable
CREATE TABLE "EventNotice" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "updatedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventNotice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventNotice_eventId_key" ON "EventNotice"("eventId");

-- CreateIndex
CREATE INDEX "EventNotice_updatedAt_idx" ON "EventNotice"("updatedAt");

-- AddForeignKey
ALTER TABLE "EventNotice" ADD CONSTRAINT "EventNotice_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
