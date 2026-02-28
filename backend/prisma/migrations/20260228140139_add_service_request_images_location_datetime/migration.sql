-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "latitude" DECIMAL(10,7),
ADD COLUMN     "longitude" DECIMAL(10,7),
ADD COLUMN     "preferredDate" TIMESTAMP(3),
ADD COLUMN     "preferredTime" TEXT;
