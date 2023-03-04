import t from 'tap';
import {createProjectRequestMapper} from '../../../../src/modules/project/mapper/create-project-mapper';
import * as DomainModel from '../../../../src/modules/project/domain';

t.test(
  'should map ProjectCreateRequest to Prisma ProjectCreateRequest with default values',
  async t => {
    const result = createProjectRequestMapper({
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
      },
      name: 'Untitled',
      editors: [],
      editorOptions: {
        fontId: 'fontId',
        showLineNumbers: null,
        themeId: 'themeId',
        fontWeight: 400,
        enableLigatures: true,
      },
    });

    t.strictSame(result, {
      frame: {
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
      },
      editors: [],
      name: 'Untitled',
      editorOptions: {
        fontId: 'fontId',
        showLineNumbers: false,
        themeId: 'themeId',
        fontWeight: 400,
        enableLigatures: true,
      },
    } as DomainModel.ProjectCreateRequest);
  },
);
