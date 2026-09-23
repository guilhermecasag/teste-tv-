-- AlterTable
ALTER TABLE "trip_travel_info" ADD COLUMN     "hotelLatitude" DOUBLE PRECISION,
ADD COLUMN     "hotelLongitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "weather_cache" (
    "id" TEXT NOT NULL,
    "locationKey" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weather_cache_locationKey_key" ON "weather_cache"("locationKey");
