/*
  Warnings:

  - You are about to drop the column `snippetId` on the `SnippetEditorOptions` table. All the data in the column will be lost.
  - You are about to drop the column `snippetId` on the `SnippetEditorTab` table. All the data in the column will be lost.
  - You are about to drop the column `snippetId` on the `SnippetFrame` table. All the data in the column will be lost.
  - You are about to drop the column `snippetId` on the `SnippetTerminal` table. All the data in the column will be lost.
  - You are about to drop the `Snippet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkspaceItem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[projectId]` on the table `SnippetEditorOptions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId]` on the table `SnippetEditorTab` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId]` on the table `SnippetFrame` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId]` on the table `SnippetTerminal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectId` to the `SnippetEditorOptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `SnippetEditorTab` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `SnippetFrame` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `SnippetTerminal` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Snippet" DROP CONSTRAINT "Snippet_workspaceItemId_fkey";

-- DropForeignKey
ALTER TABLE "SnippetEditorOptions" DROP CONSTRAINT "SnippetEditorOptions_snippetId_fkey";

-- DropForeignKey
ALTER TABLE "SnippetEditorTab" DROP CONSTRAINT "SnippetEditorTab_snippetId_fkey";

-- DropForeignKey
ALTER TABLE "SnippetFrame" DROP CONSTRAINT "SnippetFrame_snippetId_fkey";

-- DropForeignKey
ALTER TABLE "SnippetTerminal" DROP CONSTRAINT "SnippetTerminal_snippetId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceItem" DROP CONSTRAINT "WorkspaceItem_userId_fkey";

-- DropIndex
DROP INDEX "SnippetEditorOptions_snippetId_key";

-- DropIndex
DROP INDEX "SnippetEditorTab_snippetId_key";

-- DropIndex
DROP INDEX "SnippetFrame_snippetId_key";

-- DropIndex
DROP INDEX "SnippetTerminal_snippetId_key";

-- Renaname Column 
ALTER TABLE "SnippetEditorOptions"
RENAME COLUMN "snippetId" TO "projectId";

-- AlterTable
ALTER TABLE "SnippetEditorTab"
RENAME COLUMN "snippetId" TO "projectId";

-- AlterTable
ALTER TABLE "SnippetFrame" 
RENAME COLUMN "snippetId" TO "projectId";

-- AlterTable
ALTER TABLE "SnippetTerminal" 
RENAME COLUMN "snippetId" TO "projectId";

-- DropTable
DROP TABLE "Snippet";

-- DropTable
DROP TABLE "WorkspaceItem";

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SnippetEditorOptions_projectId_key" ON "SnippetEditorOptions"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "SnippetEditorTab_projectId_key" ON "SnippetEditorTab"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "SnippetFrame_projectId_key" ON "SnippetFrame"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "SnippetTerminal_projectId_key" ON "SnippetTerminal"("projectId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnippetFrame" ADD CONSTRAINT "SnippetFrame_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnippetTerminal" ADD CONSTRAINT "SnippetTerminal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnippetEditorOptions" ADD CONSTRAINT "SnippetEditorOptions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnippetEditorTab" ADD CONSTRAINT "SnippetEditorTab_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
