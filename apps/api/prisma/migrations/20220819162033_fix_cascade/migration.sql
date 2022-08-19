-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_editorOptionsId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_frameId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_terminalId_fkey";

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "SnippetFrame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "SnippetTerminal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_editorOptionsId_fkey" FOREIGN KEY ("editorOptionsId") REFERENCES "SnippetEditorOptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
