import type {User} from '@codeimage/prisma-models';
import {afterEach, assert, beforeEach, expect, test} from 'vitest';
import type {
  ProjectUpdateRequest,
  ProjectUpdateResponse,
} from '../../../../src/modules/project/schema/index.js';

import {build} from '../../../helper.js';
import {
  clearAllSeeds,
  client,
  projectSeed,
  userSeed,
} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
  project1: Awaited<ReturnType<typeof projectSeed.createProject>>;
}

function buildUpdateRequest(editorId: string): ProjectUpdateRequest {
  return {
    frame: {
      background: '#fff',
      opacity: 100,
      visible: true,
      radius: 0,
      padding: 0,
    },
    editors: [
      {
        id: editorId,
        code: '## title',
        languageId: 'markdown',
        tabName: 'README.md',
        lineNumberStart: 1,
      },
      {
        id: 'temp',
        code: '2',
        languageId: 'typescript',
        tabName: 'index.tsx',
        lineNumberStart: 300,
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
      borderType: 'glass',
    },
  };
}

beforeEach<TestContext>(async context => {
  context.user = await userSeed.createUser();
  context.project1 = await projectSeed.createProject(
    'project to update',
    context.user.id,
  );
});

afterEach(async () => {
  await clearAllSeeds();
});

test<TestContext>('POST /v1/project/:id [Update Project] -> 200', async context => {
  const fastify = await build(context);
  const userId = context.user.id;

  const data = buildUpdateRequest(context.project1.editorTabs[0].id);

  const response = await fastify.inject({
    url: `/api/v1/project/${context.project1.id}`,
    method: 'PUT',
    payload: data,
  });

  const body = JSON.parse(response.body) as ProjectUpdateResponse;

  assert.ok(body.editorTabs.length === 2);
  assert.equal(response.statusCode, 200, 'return status 200');
  assert.deepStrictEqual(
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
  assert.deepStrictEqual(
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
  assert.deepStrictEqual(
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
      borderType: 'glass',
    } satisfies ProjectUpdateResponse['terminal'],
    'return updated terminal',
  );
  assert.deepStrictEqual(
    body.editorTabs,
    [
      {
        id: context.project1.editorTabs[0].id,
        code: '## title',
        languageId: 'markdown',
        tabName: 'README.md',
        lineNumberStart: 1,
      },
      {
        id: body.editorTabs[1].id,
        code: '2',
        languageId: 'typescript',
        tabName: 'index.tsx',
        lineNumberStart: 300,
      },
    ] as ProjectUpdateResponse['editorTabs'],
    'return updated editor tabs',
  );
  assert.notEqual(body.updatedAt, context.project1.updatedAt.toISOString());
  assert.equal(body.name, 'project to update', 'return same name');
});

test<TestContext>('PUT /v1/project/:id [Update Project] -> 404 when the project belongs to another user', async context => {
  const fastify = await build(context);
  const otherUser = await userSeed.createUser();
  const otherProject = await projectSeed.createProject(
    'owned by another user',
    otherUser.id,
  );

  const response = await fastify.inject({
    url: `/api/v1/project/${otherProject.id}`,
    method: 'PUT',
    payload: buildUpdateRequest(otherProject.editorTabs[0].id),
  });

  const stored = await client.project.findUniqueOrThrow({
    where: {id: otherProject.id},
    include: {editorTabs: true, frame: true},
  });

  assert.equal(response.statusCode, 404, 'return status 404');
  assert.equal(stored.editorTabs.length, 1, 'keeps the stored editor tabs');
  assert.equal(stored.editorTabs[0].code, 'code', 'keeps the stored code');
  assert.equal(
    stored.frame.background,
    otherProject.frame.background,
    'keeps the stored frame',
  );
});
