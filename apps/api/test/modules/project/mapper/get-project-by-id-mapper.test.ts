import {assert, test} from 'vitest';
import {toProjectResponse} from '../../../../src/modules/project/project.http.js';
import {asUserId} from '../../../../src/shared/principal.js';
import type * as SchemaModel from '../../../../src/modules/project/project.contract.js';

test('should map Prisma ProjectGetByIdResponse to schema ProjectGetByIdResponse', async () => {
  const date1 = new Date();
  const date2 = new Date();

  const result = toProjectResponse({
    id: '1',
    ownerId: asUserId('userId1'),
    updatedAt: date1,
    createdAt: date2,
    frame: {
      id: 'frameId',
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
      borderType: 'hairline',
      surface: 'wash',
    },
    name: 'Untitled',
    editorOptions: {
      id: 'editorOptionsId',
      fontId: 'fontId',
      showLineNumbers: true,
      themeId: 'themeId',
      fontWeight: 400,
      enableLigatures: true,
    },
    isOwner: false,
    editorTabs: [],
  });

  assert.deepStrictEqual(result, {
    id: '1',
    name: 'Untitled',
    ownerId: asUserId('userId1'),
    createdAt: date2.toISOString(),
    updatedAt: date1.toISOString(),
    isOwner: false,
    editorTabs: [],
    frame: {
      id: 'frameId',
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
      borderType: 'hairline',
      surface: 'wash',
    },
    editorOptions: {
      id: 'editorOptionsId',
      fontId: 'fontId',
      showLineNumbers: true,
      themeId: 'themeId',
      fontWeight: 400,
      enableLigatures: true,
    },
  } as SchemaModel.ProjectGetByIdResponse);
});
