ALTER TABLE "Rsvp"
ADD COLUMN "approvalStatus" TEXT,
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvedBy" TEXT,
ADD COLUMN "approvalNote" TEXT;
