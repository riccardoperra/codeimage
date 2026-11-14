import {expect, test} from 'vitest';
import cloneHandler from '../../../src/modules/project/commands/clone-project.js';
import getHandler from '../../../src/modules/project/queries/get-project.js';
import type {ProjectRepository} from '../../../src/modules/project/project.repository.js';
import {testActor} from '../../helpers/fakes.js';

const repository = (
  findById: ProjectRepository['findById'],
): ProjectRepository => ({
  findById,
  ownedBy: () => ({
    list: async () => [],
    create: async () => {
      throw new Error('unexpected create');
    },
    update: async () => null,
    updateName: async () => null,
    remove: async () => null,
  }),
});

test('missing shared reads and clone sources retain distinct errors', async () => {
  const projects = repository(async () => null);
  await expect(
    getHandler.factory({projects})({
      viewer: {kind: 'anonymous'},
      id: 'missing',
    }),
  ).rejects.toMatchObject({
    code: 'PROJECT_NOT_FOUND',
    message: 'Project with id missing not found',
  });
  await expect(
    cloneHandler.factory({projects})({
      actor: testActor(),
      sourceId: 'missing',
      newName: null,
    }),
  ).rejects.toMatchObject({
    code: 'PROJECT_CLONE_SOURCE_NOT_FOUND',
    message: 'Cannot clone project with id missing since it does not exists',
  });
});

test('clone propagates persistence failures unchanged', async () => {
  const error = new Error('connection failed');
  const projects = repository(async () => {
    throw error;
  });
  await expect(
    cloneHandler.factory({projects})({
      actor: testActor(),
      sourceId: 'source',
      newName: null,
    }),
  ).rejects.toBe(error);
});
