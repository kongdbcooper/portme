-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageKey" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_images_productId_order_idx" ON "product_images"("productId", "order");

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing single images to the new product_images table
INSERT INTO "product_images" ("id", "productId", "imageUrl", "imageKey", "order")
SELECT gen_random_uuid(), "id", "imageUrl", "imageKey", 0
FROM "products"
WHERE "imageUrl" IS NOT NULL AND "imageUrl" != '';
