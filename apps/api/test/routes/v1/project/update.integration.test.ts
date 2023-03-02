import * as sinon from 'sinon';
import t from 'tap';
import {
  ProjectUpdateRequest,
  ProjectUpdateResponse,
} from '../../../../src/modules/project/schema';

import {build} from '../../../helper';
import {projectSeed, userSeed} from '../../../helpers/seed';

t.before(async () => {
  t.context.user = await userSeed.createUser();
  t.context.project1 = await projectSeed.createProject(
    'project to update',
    t.context.user.id,
  );
});

t.test('POST /v1/project/:id [Update Project] -> 200', async t => {
  const fastify = await build(t);
  const userId = t.context.user.id;
  const spy = sinon.spy(fastify.projectService, 'update');

  const data: ProjectUpdateRequest = {
    frame: {
      background: '#fff',
      opacity: 100,
      visible: true,
      radius: 0,
      padding: 0,
    },
    editors: [
      {
        id: t.context.project1.editorTabs[0].id,
        code: '## title',
        languageId: 'markdown',
        tabName: 'README.md',
      },
      {
        id: 'temp',
        code: '2',
        languageId: 'typescript',
        tabName: 'index.tsx',
      },
    ],
    editorOptions: {
      fontWeight: 600,
      showLineNumbers: false,
      fontId: '3',
      themeId: 'vscode',
      enableLigatures: true,
    },
    terminal: {
      opacity: 0,
      background: 'red',
      textColor: 'white',
      showWatermark: false,
      showHeader: true,
      showGlassReflection: false,
      shadow: '1px 0px 0px #000',
      alternativeTheme: true,
      accentVisible: false,
      type: 'windows',
    },
  };

  const response = await fastify.inject({
    url: `/api/v1/project/${t.context.project1.id}`,
    method: 'PUT',
    payload: data,
  });

  const body = JSON.parse(response.body) as ProjectUpdateResponse;

  t.ok(
    spy.withArgs(userId, t.context.project1.id, data).calledOnce,
    'has been called once',
  );
  t.ok(body.editorTabs.length === 2);
  t.same(response.statusCode, 200, 'return status 200');
  t.strictSame(
    body.frame,
    {
      background: '#fff',
      opacity: 100,
      visible: true,
      radius: 0,
      padding: 0,
    } as ProjectUpdateResponse['frame'],
    'return updated frame',
  );
  t.strictSame(
    body.editorOptions,
    {
      fontWeight: 600,
      showLineNumbers: false,
      fontId: '3',
      themeId: 'vscode',
      enableLigatures: true,
    } as ProjectUpdateResponse['editorOptions'],
    'return updated editor options',
  );
  t.strictSame(
    body.terminal,
    {
      opacity: 0,
      background: 'red',
      textColor: 'white',
      showWatermark: false,
      showHeader: true,
      showGlassReflection: false,
      shadow: '1px 0px 0px #000',
      alternativeTheme: true,
      accentVisible: false,
      type: 'windows',
    } as ProjectUpdateResponse['terminal'],
    'return updated terminal',
  );
  t.strictSame(
    body.editorTabs,
    [
      {
        id: t.context.project1.editorTabs[0].id,
        code: '## title',
        languageId: 'markdown',
        tabName: 'README.md',
      },
      {
        id: body.editorTabs[1].id,
        code: '2',
        languageId: 'typescript',
        tabName: 'index.tsx',
      },
    ] as ProjectUpdateResponse['editorTabs'],
    'return updated editor tabs',
  );
  t.notSame(body.updatedAt, t.context.project1.updatedAt.toISOString());
  t.same(body.name, 'project to update', 'return same name');
});
