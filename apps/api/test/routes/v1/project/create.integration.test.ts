import * as sinon from 'sinon';
import t from 'tap';
import {
  ProjectCreateRequest,
  ProjectCreateResponse,
} from '../../../../src/modules/project/schema';

import {build} from '../../../helper';
import {userSeed} from '../../../helpers/seed';

t.before(async () => {
  t.context.user = await userSeed.createUser();
});

t.test('POST /v1/project/ [Create Project] -> 200', async t => {
  const fastify = await build(t);
  const userId = t.context.user.id;
  const spy = sinon.spy(fastify.projectService, 'createNewProject');

  const data: ProjectCreateRequest = {
    name: 'Data',
    frame: {
      background: '#fff',
      opacity: 100,
      visible: true,
      radius: 0,
      padding: 0,
    },
    editors: [
      {code: 'function(){}', languageId: 'javascript', tabName: 'index.jsx'},
    ],
    editorOptions: {
      fontWeight: 400,
      showLineNumbers: true,
      fontId: '1',
      themeId: 'default',
      enableLigatures: true,
    },
    terminal: {
      opacity: 1,
      background: '#fff',
      textColor: '#000',
      showWatermark: true,
      showHeader: true,
      showGlassReflection: true,
      shadow: '0px 0px 0px #000',
      alternativeTheme: false,
      accentVisible: true,
      type: 'macOS',
    },
  };

  const response = await fastify.inject({
    url: `/api/v1/project`,
    method: 'POST',
    payload: data,
  });

  const body = JSON.parse(response.body) as ProjectCreateResponse;

  t.ok(spy.withArgs(userId, data).calledOnce, 'has been called once');
  t.same(response.statusCode, 200, 'return status 200');
  t.strictSame(body.name, 'Data');
});
