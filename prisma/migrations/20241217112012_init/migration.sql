-- CreateTable
CREATE TABLE "Earthquake" (
    "id" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "magnitude" DOUBLE PRECISION NOT NULL,
    "place" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "updated" TIMESTAMP(3) NOT NULL,
    "detailUrl" TEXT NOT NULL,
    "coordinates" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Earthquake_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Earthquake_apiId_key" ON "Earthquake"("apiId");
