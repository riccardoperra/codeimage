import {assert, test} from 'vitest';
import type {ProjectDraft} from '../../../../src/modules/project/project.model.js';
import {draftFromCreateBody} from '../../../../src/modules/project/project.model.js';

test('should map ProjectCreateRequest to Prisma ProjectCreateRequest with default values', async () => {
  const result = draftFromCreateBody({
    frame: {
      visible: null,
      radius: null,
      padding: null,
      opacity: null,
      background: null,
    },
    terminal: {
      opacity: null,
      background: null,
      type: 'macOS',
      showWatermark: null,
      alternativeTheme: null,
      showGlassReflection: null,
      showHeader: true,
      shadow: null,
      textColor: null,
      accentVisible: null,
      borderType: null,
    },
    name: 'Untitled',
    editors: [
      {
        code: 'const n = 1;',
        languageId: 'typescript',
        tabName: 'n.ts',
        lineNumberStart: 1,
        marks: {lines: [{line: 1, kind: 'added'}], focusedLines: [2]},
      },
    ],
    editorOptions: {
      fontId: 'fontId',
      showLineNumbers: null,
      themeId: 'themeId',
      fontWeight: 400,
      enableLigatures: true,
    },
  });

  assert.deepStrictEqual(result, {
    frame: {
      aspectRatio: null,
      exportTarget: null,
      signature: null,
      background: null,
      visible: true,
      padding: 32,
      opacity: 100,
      radius: 24,
    },
    terminal: {
      accentVisible: false,
      alternativeTheme: false,
      background: null,
      shadow: null,
      showGlassReflection: false,
      textColor: null,
      type: 'macOS',
      showWatermark: true,
      opacity: 100,
      showHeader: true,
      borderType: null,
    },
    editorTabs: [
      {
        code: 'const n = 1;',
        languageId: 'typescript',
        tabName: 'n.ts',
        lineNumberStart: 1,
        marks: {lines: [{line: 1, kind: 'added'}], focusedLines: [2]},
      },
    ],
    name: 'Untitled',
    editorOptions: {
      fontId: 'fontId',
      showLineNumbers: false,
      themeId: 'themeId',
      fontWeight: 400,
      enableLigatures: true,
    },
    animation: null,
  } satisfies ProjectDraft);
});
