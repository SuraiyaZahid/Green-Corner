-- CreateTable
-- Singleton row for the store-wide configuration. The id is pinned to
-- 'default' so there can only ever be one settings row.
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "discountPercentage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- AlterTable
-- The discount that applied when the order was placed is stored on the
-- order so a historical invoice never changes when the store discount is
-- later edited or removed.
ALTER TABLE "Order" ADD COLUMN "discountPercentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "subtotalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
