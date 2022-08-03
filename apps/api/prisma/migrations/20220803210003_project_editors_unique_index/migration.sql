/*
  Warnings:

  - A unique constraint covering the columns `[id,projectId]` on the table `SnippetEditorTab` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "SnippetEditorTab_projectId_key";

-- CreateIndex
CREATE UNIQUE INDEX "SnippetEditorTab_id_projectId_key" ON "SnippetEditorTab"("id", "projectId");
