import * as sinon from 'sinon';
import t from 'tap';
import {ProjectCreateResponse} from '../../../../src/modules/project/domain';
import createNewProject from '../../../../src/modules/project/handlers/createNewProject';
import {makeMockProjectService} from './project.service.test';

t.beforeEach(() => sinon.reset());

t.test('create project', async t => {
  const dependencies = makeMockProjectService();
  const data = {
    name: 'new project',
    editorOptions: {
      fontId: 'fontId',
      fontWeight: 300,
      showLineNumbers: true,
      themeId: 'themeId',
    },
    editors: [],
    frame: {
      background: '#fff',
      opacity: 1,
      padding: 32,
      radius: 32,
      visible: true,
    },
    terminal: {
      opacity: 1,
      background: '#fff',
      accentVisible: true,
      alternativeTheme: false,
      shadow: null,
      showGlassReflection: true,
      showHeader: true,
      showWatermark: true,
      textColor: '#fff',
      type: 'macOS',
    },
  };

  sinon.stub(dependencies.repository, 'createNewProject').resolves({
    ...data,
    updatedAt: new Date(),
    createdAt: new Date(),
    userId: 'userId1',
    id: 'projectId1',
    terminalId: 'terminalId1',
    editorOptionsId: 'editorOptionsId1',
    frameId: 'frameId1',
  } as unknown as ProjectCreateResponse);

  const result = await createNewProject(dependencies)('userId', data);

  t.strictSame(result.name, 'new project');
});
