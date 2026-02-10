/*
  Warnings:

  - Changed the type of `date` on the `Event` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "endAt" TIMESTAMP(3),
DROP COLUMN "date",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "deadline" DROP NOT NULL,
ALTER COLUMN "place" DROP NOT NULL,
ALTER COLUMN "fee" DROP NOT NULL;
