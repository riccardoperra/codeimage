import {expect, test} from 'vitest';
import cloneHandler from '../../../src/modules/project/commands/clone-project.js';
import getHandler from '../../../src/modules/project/queries/get-project.js';
import type {ProjectDependencies} from '../../../src/modules/project/project.repository.js';
import {testActor, scopeFor} from '../../helpers/fakes.js';

const dependencies = (
  findProject: ProjectDependencies['findProject'],
): ProjectDependencies => ({
  findProject,
  scopeFor,
  projects: {
    listProjects: async () => [],
    createProject: async () => {
      throw new Error('unexpected create');
    },
    updateProject: async () => null,
    renameProject: async () => null,
    removeProject: async () => null,
  },
});

test('missing shared reads and clone sources retain distinct errors', async () => {
  const deps = dependencies(async () => null);
  await expect(
    getHandler.factory(deps)({
      viewer: {kind: 'anonymous'},
      id: 'missing',
    }),
  ).rejects.toMatchObject({
    code: 'PROJECT_NOT_FOUND',
    message: 'Project with id missing not found',
  });
  await expect(
    cloneHandler.factory(deps)({
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
  const deps = dependencies(async () => {
    throw error;
  });
  await expect(
    cloneHandler.factory(deps)({
      actor: testActor(),
      sourceId: 'source',
      newName: null,
    }),
  ).rejects.toBe(error);
});
