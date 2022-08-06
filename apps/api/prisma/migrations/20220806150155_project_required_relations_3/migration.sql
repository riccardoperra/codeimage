/*
  Warnings:

  - Made the column `languageId` on table `SnippetEditorTab` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `SnippetTerminal` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SnippetEditorTab" ALTER COLUMN "code" DROP NOT NULL,
ALTER COLUMN "languageId" SET NOT NULL,
ALTER COLUMN "tabName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SnippetTerminal" ALTER COLUMN "showHeader" DROP NOT NULL,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "accentVisible" DROP NOT NULL,
ALTER COLUMN "showWatermark" DROP NOT NULL,
ALTER COLUMN "showGlassReflection" DROP NOT NULL,
ALTER COLUMN "alternativeTheme" DROP NOT NULL;
