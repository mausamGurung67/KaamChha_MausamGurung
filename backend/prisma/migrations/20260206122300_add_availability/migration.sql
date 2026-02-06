-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'UNAVAILABLE',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Availability_technicianId_key" ON "Availability"("technicianId");

-- CreateIndex
CREATE INDEX "Availability_status_idx" ON "Availability"("status");

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
