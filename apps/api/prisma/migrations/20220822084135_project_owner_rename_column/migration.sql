/*
  Warnings:

  - You are about to drop the column `userId` on the `Project` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id,ownerId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- DropIndex
ALTER INDEX "Project_id_userId_key" RENAME TO "Project_id_ownerId_idx";

-- DropIndex
ALTER INDEX "Project_name_userId_idx" RENAME TO "Project_name_ownerId_idx";

-- AlterTable
ALTER TABLE "Project" RENAME COLUMN "userId" TO "ownerId";
