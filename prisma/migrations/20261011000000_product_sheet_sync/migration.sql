-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "sheetManaged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "sheetManaged" BOOLEAN NOT NULL DEFAULT false;
