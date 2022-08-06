/*
  Warnings:

  - Made the column `fontWeight` on table `SnippetEditorOptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `showLineNumbers` on table `SnippetEditorOptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `code` on table `SnippetEditorTab` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tabName` on table `SnippetEditorTab` required. This step will fail if there are existing NULL values in that column.
  - Made the column `showHeader` on table `SnippetTerminal` required. This step will fail if there are existing NULL values in that column.
  - Made the column `accentVisible` on table `SnippetTerminal` required. This step will fail if there are existing NULL values in that column.
  - Made the column `showWatermark` on table `SnippetTerminal` required. This step will fail if there are existing NULL values in that column.
  - Made the column `showGlassReflection` on table `SnippetTerminal` required. This step will fail if there are existing NULL values in that column.
  - Made the column `alternativeTheme` on table `SnippetTerminal` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SnippetEditorOptions" ALTER COLUMN "fontWeight" SET NOT NULL,
ALTER COLUMN "fontWeight" SET DEFAULT 400,
ALTER COLUMN "showLineNumbers" SET NOT NULL,
ALTER COLUMN "showLineNumbers" SET DEFAULT false;

-- AlterTable
ALTER TABLE "SnippetEditorTab" ALTER COLUMN "code" SET NOT NULL,
ALTER COLUMN "code" SET DEFAULT '',
ALTER COLUMN "tabName" SET NOT NULL,
ALTER COLUMN "tabName" SET DEFAULT '';

-- AlterTable
ALTER TABLE "SnippetTerminal" ALTER COLUMN "showHeader" SET NOT NULL,
ALTER COLUMN "showHeader" SET DEFAULT true,
ALTER COLUMN "accentVisible" SET NOT NULL,
ALTER COLUMN "accentVisible" SET DEFAULT false,
ALTER COLUMN "showWatermark" SET NOT NULL,
ALTER COLUMN "showWatermark" SET DEFAULT true,
ALTER COLUMN "showGlassReflection" SET NOT NULL,
ALTER COLUMN "showGlassReflection" SET DEFAULT false,
ALTER COLUMN "alternativeTheme" SET NOT NULL,
ALTER COLUMN "alternativeTheme" SET DEFAULT false;
