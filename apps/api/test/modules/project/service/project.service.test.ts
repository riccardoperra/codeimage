import {HttpErrors} from '@fastify/sensible/lib/httpError';
import * as sinon from 'sinon';
import t from 'tap';
import {ProjectCreateResponse} from '../../../../src/modules/project/domain';
import {makeProjectService} from '../../../../src/modules/project/handlers/project.service';
import {ProjectRepository} from '../../../../src/modules/project/repository';

t.test('create project', async t => {
  const mockRepository = sinon.stub({
    createNewProject: function () {},
  } as unknown as ProjectRepository);
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

  const service = makeProjectService(mockRepository, {} as HttpErrors);

  mockRepository.createNewProject.returns(
    Promise.resolve({
      ...data,
      updatedAt: new Date(),
      createdAt: new Date(),
      userId: 'userId1',
      id: 'projectId1',
      terminalId: 'terminalId1',
      editorOptionsId: 'editorOptionsId1',
      frameId: 'frameId1',
    } as unknown as ProjectCreateResponse),
  );

  const result = await service.createNewProject('userId', data);

  t.strictSame(result.name, 'new project');
});
