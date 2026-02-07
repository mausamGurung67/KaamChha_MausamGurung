/*
  Warnings:

  - You are about to drop the `Availability` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Availability" DROP CONSTRAINT "Availability_technicianId_fkey";

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "inclusions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropTable
DROP TABLE "Availability";

-- DropEnum
DROP TYPE "AvailabilityStatus";
