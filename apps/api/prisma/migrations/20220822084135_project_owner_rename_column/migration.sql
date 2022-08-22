/*
  Warnings:

  - You are about to drop the column `userId` on the `Project` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id,ownerId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- DropIndex
DROP INDEX "Project_id_userId_key";

-- DropIndex
DROP INDEX "Project_name_userId_idx";

-- AlterTable
ALTER TABLE "Project" RENAME COLUMN "userId" TO "ownerId";

-- AlterIndex
CREATE INDEX "Project_name_ownerId_idx" ON "Project"("name", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_id_ownerId_key" ON "Project"("id", "ownerId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
