import {assert, test} from 'vitest';
import {createCompleteProjectGetByIdResponseMapper} from '../../../../src/modules/project/mapper/get-project-by-id-mapper.js';
import type * as SchemaModel from '../../../../src/modules/project/schema/index.js';

test('should map Prisma ProjectGetByIdResponse to schema ProjectGetByIdResponse', async () => {
  const date1 = new Date();
  const date2 = new Date();

  const result = createCompleteProjectGetByIdResponseMapper({
    id: '1',
    ownerId: 'userId1',
    updatedAt: date1,
    createdAt: date2,
    frame: {
      id: 'frameId',
      aspectRatio: null,
      exportTarget: 'x-landscape',
      signatureHandle: '@me',
      signaturePosition: 'bottom-left',
      visible: true,
      radius: 24,
      padding: 32,
      opacity: 100,
      background: null,
    },
    terminal: {
      id: 'terminalId',
      opacity: 100,
      background: null,
      type: 'macOS',
      showWatermark: false,
      alternativeTheme: true,
      showGlassReflection: true,
      showHeader: true,
      shadow: null,
      textColor: null,
      accentVisible: true,
      borderType: 'glass',
    },
    editorOptionsId: 'editorOptionsId',
    terminalId: 'terminalId',
    frameId: 'frameId',
    name: 'Untitled',
    editorOptions: {
      id: 'editorOptionsId',
      fontId: 'fontId',
      showLineNumbers: true,
      themeId: 'themeId',
      fontWeight: 400,
      enableLigatures: true,
    },
    editorTabs: [
      {
        id: 'tabId',
        projectId: '1',
        code: 'const n = 1;',
        languageId: 'typescript',
        tabName: 'n.ts',
        lineNumberStart: 1,
        marks: {lines: [{line: 1, kind: 'highlight'}], focus: true},
      },
    ],
  });

  assert.deepStrictEqual(result, {
    id: '1',
    name: 'Untitled',
    ownerId: 'userId1',
    createdAt: date2.toISOString(),
    updatedAt: date1.toISOString(),
    isOwner: false,
    editorTabs: [
      {
        id: 'tabId',
        projectId: '1',
        code: 'const n = 1;',
        languageId: 'typescript',
        tabName: 'n.ts',
        lineNumberStart: 1,
        marks: {lines: [{line: 1, kind: 'highlight'}], focus: true},
      },
    ],
    frame: {
      id: 'frameId',
      aspectRatio: null,
      exportTarget: 'x-landscape',
      signature: {handle: '@me', position: 'bottom-left'},
      background: '',
      visible: true,
      padding: 32,
      opacity: 100,
      radius: 24,
    },
    terminal: {
      id: 'terminalId',
      accentVisible: true,
      alternativeTheme: true,
      background: '',
      shadow: null,
      showGlassReflection: true,
      textColor: '',
      type: 'macOS',
      showWatermark: false,
      opacity: 100,
      showHeader: true,
      borderType: 'glass',
    },
    editorOptions: {
      id: 'editorOptionsId',
      fontId: 'fontId',
      showLineNumbers: true,
      themeId: 'themeId',
      fontWeight: 400,
      enableLigatures: true,
    },
  } as SchemaModel.ProjectCompleteResponse);
});
