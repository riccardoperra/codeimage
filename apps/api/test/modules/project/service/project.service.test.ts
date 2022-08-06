import {stub} from 'sinon';
import t from 'tap';
import {ProjectRepository} from '../../../../dist/modules/project/repository';
import {makeProjectService} from '../../../../dist/modules/project/service/project.service';
import {ProjectCreateResponse} from '../../../../src/modules/project/domain';

t.test('create project', async t => {
  const mockRepository = stub({
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

  const service = makeProjectService(mockRepository);

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
