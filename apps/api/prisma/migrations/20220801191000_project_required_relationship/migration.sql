/*
  Warnings:

  - You are about to drop the column `projectId` on the `SnippetEditorOptions` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `SnippetFrame` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `SnippetTerminal` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[frameId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[terminalId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[editorOptionsId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `editorOptionsId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `frameId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `terminalId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SnippetEditorOptions" DROP CONSTRAINT "SnippetEditorOptions_projectId_fkey";

-- DropForeignKey
ALTER TABLE "SnippetFrame" DROP CONSTRAINT "SnippetFrame_projectId_fkey";

-- DropForeignKey
ALTER TABLE "SnippetTerminal" DROP CONSTRAINT "SnippetTerminal_projectId_fkey";

-- DropIndex
DROP INDEX "SnippetEditorOptions_projectId_key";

-- DropIndex
DROP INDEX "SnippetFrame_projectId_key";

-- DropIndex
DROP INDEX "SnippetTerminal_projectId_key";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "editorOptionsId" TEXT NOT NULL,
ADD COLUMN     "frameId" TEXT NOT NULL,
ADD COLUMN     "terminalId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SnippetEditorOptions" DROP COLUMN "projectId";

-- AlterTable
ALTER TABLE "SnippetFrame" DROP COLUMN "projectId";

-- AlterTable
ALTER TABLE "SnippetTerminal" DROP COLUMN "projectId";

-- CreateIndex
CREATE UNIQUE INDEX "Project_frameId_key" ON "Project"("frameId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_terminalId_key" ON "Project"("terminalId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_editorOptionsId_key" ON "Project"("editorOptionsId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "SnippetFrame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "SnippetTerminal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_editorOptionsId_fkey" FOREIGN KEY ("editorOptionsId") REFERENCES "SnippetEditorOptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
