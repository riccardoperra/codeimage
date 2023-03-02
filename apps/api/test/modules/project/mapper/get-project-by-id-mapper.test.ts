import t from 'tap';
import {createCompleteProjectGetByIdResponseMapper} from '../../../../src/modules/project/mapper/get-project-by-id-mapper';
import * as SchemaModel from '../../../../src/modules/project/schema';

t.test(
  'should map Prisma ProjectGetByIdResponse to schema ProjectGetByIdResponse',
  async t => {
    const date1 = new Date();
    const date2 = new Date();

    const result = createCompleteProjectGetByIdResponseMapper({
      id: '1',
      ownerId: 'userId1',
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
      editorTabs: [],
    });

    t.strictSame(result, {
      id: '1',
      name: 'Untitled',
      ownerId: 'userId1',
      createdAt: date1.toISOString(),
      updatedAt: date2.toISOString(),
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
  },
);
