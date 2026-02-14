-- CreateTable
CREATE TABLE "LineLoginUser" (
    "id" TEXT NOT NULL,
    "lineUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "pictureUrl" TEXT,
    "lastLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineLoginUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LineLoginUser_lineUserId_key" ON "LineLoginUser"("lineUserId");

-- CreateIndex
CREATE INDEX "LineLoginUser_lastLoginAt_idx" ON "LineLoginUser"("lastLoginAt");
