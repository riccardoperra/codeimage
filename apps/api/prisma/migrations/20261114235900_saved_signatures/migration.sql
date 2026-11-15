-- AlterTable
ALTER TABLE "SnippetFrame" ADD COLUMN     "signatureProfile" TEXT,
ADD COLUMN     "signatureId" TEXT;

-- CreateTable
CREATE TABLE "Signature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "version" BIGINT NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Signature_ownerId_idx" ON "Signature"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Signature_id_ownerId_key" ON "Signature"("id", "ownerId");

-- AddForeignKey
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
