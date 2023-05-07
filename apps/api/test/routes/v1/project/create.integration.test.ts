import {User} from '@codeimage/prisma-models';
import * as sinon from 'sinon';
import {afterEach, assert, beforeEach, test} from 'vitest';
import {
  ProjectCreateRequest,
  ProjectCreateResponse,
} from '../../../../src/modules/project/schema/index.js';

import {build} from '../../../helper.js';
import {userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
}

beforeEach(() => sinon.restore());

beforeEach<TestContext>(async context => {
  context.user = await userSeed.createUser();
});

afterEach(async () => {
  await Promise.all([userSeed.clean()]);
});

test<TestContext>('POST /v1/project/ [Create Project] -> 200', async context => {
  const fastify = await build(context);
  const userId = context.user.id;
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

  const body = response.json<ProjectCreateResponse>();

  assert.ok(spy.withArgs(userId, data).calledOnce, 'has been called once');
  assert.equal(response.statusCode, 200, 'return status 200');
  assert.equal(body.name, 'Data');
});
