import type {User} from '@codeimage/prisma-models';
import {afterEach, assert, beforeEach, expect, test} from 'vitest';
import type {ProjectCreateResponse} from '../../../../src/modules/project/project.contract.js';

import {build} from '../../../helpers/app.js';
import {clearAllSeeds, client, userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
}

beforeEach<TestContext>(async context => {
  context.user = await userSeed.createUser();
});

afterEach(async () => {
  await clearAllSeeds();
});

test<TestContext>('POST /v1/project/ [Create Project] -> 200', async context => {
  const fastify = await build(context);
  const userId = context.user.id;

  const data = {
    name: 'Data',
    frame: {
      background: '#fff',
      opacity: 100,
      visible: true,
      radius: 0,
      padding: 0,
    },
    editors: [
      {
        code: 'function(){}',
        languageId: 'javascript',
        tabName: 'index.jsx',
        lineNumberStart: 300,
      },
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

  assert.equal(response.statusCode, 200, 'return status 200');
  assert.equal(body.name, 'Data');
  expect(
    await client.project.findUnique({
      where: {id: body.id},
      include: {editorTabs: true},
    }),
  ).toMatchObject({ownerId: userId, name: data.name, editorTabs: data.editors});
});
