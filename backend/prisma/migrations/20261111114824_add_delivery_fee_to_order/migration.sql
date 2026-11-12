-- CreateEnum
CREATE TYPE "DeliveryArea" AS ENUM ('INSIDE_DHAKA', 'OUTSIDE_DHAKA');

-- AlterTable
-- The columns are added with a temporary default so that the 28 pre-existing
-- orders can be backfilled, then the default is dropped.
ALTER TABLE "Order" ADD COLUMN "deliveryArea" "DeliveryArea" NOT NULL DEFAULT 'INSIDE_DHAKA',
ADD COLUMN "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 80;

-- Legacy orders were placed before delivery fees existed, so their
-- totalAmount already equals the item subtotal. They are recorded as
-- inside-Dhaka with the standard ৳80 rate; their grand total is left
-- untouched so no historical invoice changes value.
UPDATE "Order" SET "deliveryArea" = 'INSIDE_DHAKA', "deliveryFee" = 80;

ALTER TABLE "Order" ALTER COLUMN "deliveryArea" DROP DEFAULT,
ALTER COLUMN "deliveryFee" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Order_deliveryArea_idx" ON "Order"("deliveryArea");
