-- Cart lines hold their stock for a short window. When the window passes
-- the line is purged, which releases the reserved units back to the store.
-- The default keeps the column populated for rows created outside the API.
ALTER TABLE "CartItem" ADD COLUMN "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- The cleanup sweep looks up expired rows by this column.
CREATE INDEX "CartItem_expiresAt_idx" ON "CartItem"("expiresAt");
