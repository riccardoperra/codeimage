-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frameId" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "editorOptionsId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnippetFrame" (
    "id" TEXT NOT NULL,
    "background" TEXT,
    "padding" INTEGER NOT NULL DEFAULT 32,
    "radius" INTEGER,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 100,

    CONSTRAINT "SnippetFrame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnippetTerminal" (
    "id" TEXT NOT NULL,
    "showHeader" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL,
    "accentVisible" BOOLEAN NOT NULL DEFAULT false,
    "shadow" TEXT,
    "background" TEXT,
    "textColor" TEXT,
    "showWatermark" BOOLEAN NOT NULL DEFAULT true,
    "showGlassReflection" BOOLEAN NOT NULL DEFAULT false,
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "alternativeTheme" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SnippetTerminal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnippetEditorOptions" (
    "id" TEXT NOT NULL,
    "fontId" TEXT NOT NULL,
    "fontWeight" INTEGER NOT NULL DEFAULT 400,
    "showLineNumbers" BOOLEAN NOT NULL DEFAULT false,
    "themeId" TEXT NOT NULL,

    CONSTRAINT "SnippetEditorOptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnippetEditorTab" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "languageId" TEXT NOT NULL,
    "tabName" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "SnippetEditorTab_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_frameId_key" ON "Project"("frameId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_terminalId_key" ON "Project"("terminalId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_editorOptionsId_key" ON "Project"("editorOptionsId");

-- CreateIndex
CREATE INDEX "Project_name_userId_idx" ON "Project"("name", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_id_userId_key" ON "Project"("id", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SnippetEditorTab_id_projectId_key" ON "SnippetEditorTab"("id", "projectId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "SnippetFrame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "SnippetTerminal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_editorOptionsId_fkey" FOREIGN KEY ("editorOptionsId") REFERENCES "SnippetEditorOptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnippetEditorTab" ADD CONSTRAINT "SnippetEditorTab_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
