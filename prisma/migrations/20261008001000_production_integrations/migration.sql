-- CreateTable
CREATE TABLE "OrderSheetExport" (
    "id" SERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderSheetExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderSheetExport_orderId_key" ON "OrderSheetExport"("orderId");

-- CreateIndex
CREATE INDEX "OrderSheetExport_syncedAt_nextAttemptAt_idx" ON "OrderSheetExport"("syncedAt", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt");


ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "ProductImage" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "ProductVariant" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "WishlistItem" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "OrderSheetExport" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "RateLimitBucket" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "OrderStatusHistory" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "InventoryMovement" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "AnalyticsEvent" ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
