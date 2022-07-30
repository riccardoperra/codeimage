-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snippet" (
    "id" TEXT NOT NULL,
    "workspaceItemId" TEXT NOT NULL,

    CONSTRAINT "Snippet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnippetFrame" (
    "id" TEXT NOT NULL,
    "snippetId" TEXT NOT NULL,
    "background" TEXT,
    "padding" INTEGER,
    "radius" INTEGER,
    "visible" BOOLEAN,
    "opacity" DOUBLE PRECISION,

    CONSTRAINT "SnippetFrame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnippetTerminal" (
    "id" TEXT NOT NULL,
    "snippetId" TEXT NOT NULL,
    "showHeader" BOOLEAN,
    "type" TEXT,
    "accentVisible" BOOLEAN,
    "shadow" TEXT,
    "background" TEXT,
    "textColor" TEXT,
    "showWatermark" BOOLEAN,
    "showGlassReflection" BOOLEAN,
    "opacity" DOUBLE PRECISION,
    "alternativeTheme" BOOLEAN,

    CONSTRAINT "SnippetTerminal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnippetEditorOptions" (
    "id" TEXT NOT NULL,
    "snippetId" TEXT NOT NULL,
    "fontId" TEXT,
    "fontWeight" INTEGER,
    "showLineNumbers" BOOLEAN,
    "themeId" TEXT,

    CONSTRAINT "SnippetEditorOptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnippetEditorTab" (
    "id" TEXT NOT NULL,
    "snippetId" TEXT NOT NULL,
    "code" TEXT,
    "languageId" TEXT,
    "tabName" TEXT,

    CONSTRAINT "SnippetEditorTab_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Snippet_workspaceItemId_key" ON "Snippet"("workspaceItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SnippetFrame_snippetId_key" ON "SnippetFrame"("snippetId");

-- CreateIndex
CREATE UNIQUE INDEX "SnippetTerminal_snippetId_key" ON "SnippetTerminal"("snippetId");

-- CreateIndex
CREATE UNIQUE INDEX "SnippetEditorOptions_snippetId_key" ON "SnippetEditorOptions"("snippetId");

-- CreateIndex
CREATE UNIQUE INDEX "SnippetEditorTab_snippetId_key" ON "SnippetEditorTab"("snippetId");

-- AddForeignKey
ALTER TABLE "WorkspaceItem" ADD CONSTRAINT "WorkspaceItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snippet" ADD CONSTRAINT "Snippet_workspaceItemId_fkey" FOREIGN KEY ("workspaceItemId") REFERENCES "WorkspaceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnippetFrame" ADD CONSTRAINT "SnippetFrame_snippetId_fkey" FOREIGN KEY ("snippetId") REFERENCES "Snippet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnippetTerminal" ADD CONSTRAINT "SnippetTerminal_snippetId_fkey" FOREIGN KEY ("snippetId") REFERENCES "Snippet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnippetEditorOptions" ADD CONSTRAINT "SnippetEditorOptions_snippetId_fkey" FOREIGN KEY ("snippetId") REFERENCES "Snippet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnippetEditorTab" ADD CONSTRAINT "SnippetEditorTab_snippetId_fkey" FOREIGN KEY ("snippetId") REFERENCES "Snippet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
