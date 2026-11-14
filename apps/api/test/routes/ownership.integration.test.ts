import {existsSync, readdirSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import type {User} from '@codeimage/prisma-models';
import {afterEach, describe, expect, test} from 'vitest';
import type {PresetApi, ProjectApi} from '../../src/api-types.js';
import type {HttpMethod} from '../../src/shared/contract.js';
import {build} from '../helpers/app.js';
import {presetData} from '../helpers/fakes.js';
import {
  clearAllSeeds,
  client,
  presetSeed,
  projectSeed,
  userSeed,
} from '../helpers/seed.js';

interface Seeded {
  readonly id: string;
  readonly snapshot: () => Promise<unknown>;
}

interface OwnershipCase {
  readonly operation: string;
  readonly method: HttpMethod;
  readonly url: (id: string) => string;
  readonly body?: () => object;
  readonly seed: (owner: User) => Promise<Seeded>;
}

async function seedPreset(owner: User): Promise<Seeded> {
  const {id} = await presetSeed.createPresetV1('owned', owner.id);
  return {id, snapshot: () => client.preset.findUnique({where: {id}})};
}

async function seedProject(owner: User): Promise<Seeded> {
  const {id} = await projectSeed.createProject('owned', owner.id);
  return {
    id,
    snapshot: () =>
      client.project.findUnique({
        where: {id},
        include: {
          frame: true,
          terminal: true,
          editorOptions: true,
          editorTabs: true,
        },
      }),
  };
}

const presetUpdateBody = (): NonNullable<
  PresetApi['update']['request']['body']
> => ({
  name: 'stolen',
  data: presetData(),
});

const projectUpdateBody = (): NonNullable<
  ProjectApi['update']['request']['body']
> => ({
  editorOptions: {
    fontId: 'jetbrains-mono',
    fontWeight: 400,
    themeId: 'vsCodeDarkTheme',
    showLineNumbers: false,
    enableLigatures: true,
  },
  frame: {
    background: null,
    opacity: 100,
    radius: null,
    padding: 32,
    visible: true,
  },
  terminal: {
    accentVisible: false,
    alternativeTheme: false,
    background: null,
    opacity: 100,
    shadow: null,
    showGlassReflection: false,
    showHeader: true,
    showWatermark: true,
    textColor: null,
    type: 'macOS',
    borderType: null,
  },
  editors: [
    {
      id: 'tab-1',
      code: 'stolen',
      languageId: 'typescript',
      tabName: 'index.ts',
      lineNumberStart: 1,
    },
  ],
});

const cases: readonly OwnershipCase[] = [
  {
    operation: 'preset.get',
    method: 'GET',
    url: id => `/api/v1/preset/${id}`,
    seed: seedPreset,
  },
  {
    operation: 'preset.update',
    method: 'PUT',
    url: id => `/api/v1/preset/${id}`,
    body: presetUpdateBody,
    seed: seedPreset,
  },
  {
    operation: 'preset.remove',
    method: 'DELETE',
    url: id => `/api/v1/preset/${id}`,
    seed: seedPreset,
  },
  {
    operation: 'project.update',
    method: 'PUT',
    url: id => `/api/v1/project/${id}`,
    body: projectUpdateBody,
    seed: seedProject,
  },
  {
    operation: 'project.updateName',
    method: 'PUT',
    url: id => `/api/v1/project/${id}/name`,
    body: () => ({name: 'stolen'}),
    seed: seedProject,
  },
  {
    operation: 'project.remove',
    method: 'DELETE',
    url: id => `/api/v1/project/${id}`,
    seed: seedProject,
  },
];

// Projects are shared by link; signed-in viewers may clone them.
const sharedOperations: ReadonlySet<string> = new Set([
  'project.get',
  'project.clone',
]);

async function pathParamOperations(): Promise<string[]> {
  const modulesDir = resolve(import.meta.dirname, '../../src/modules');
  const found: string[] = [];
  for (const module of readdirSync(modulesDir)) {
    const file = join(modulesDir, module, `${module}.contract.ts`);
    if (!existsSync(file)) continue;
    const exported: unknown = (await import(pathToFileURL(file).href))[
      `${module}Contract`
    ];
    if (typeof exported !== 'object' || exported === null) {
      throw new Error(`${module}.contract.ts must export ${module}Contract`);
    }
    for (const [key, op] of Object.entries(exported)) {
      if (
        typeof op === 'object' &&
        op !== null &&
        'url' in op &&
        typeof op.url === 'string' &&
        op.url.includes('/:')
      ) {
        found.push(`${module}.${key}`);
      }
    }
  }
  return found;
}

afterEach(async () => {
  await clearAllSeeds();
});

describe('ownership', () => {
  test('every operation with a path param is a case or a shared operation', async () => {
    const operations = await pathParamOperations();
    const listed = new Set(cases.map(c => c.operation));

    const missing = operations.filter(
      op => !listed.has(op) && !sharedOperations.has(op),
    );
    expect(
      missing,
      'Add a cross-user case to `cases` in test/routes/ownership.integration.test.ts, or, if any caller may reach any row, add it to `sharedOperations` with a reason.',
    ).toEqual([]);

    const stale = [...listed, ...sharedOperations].filter(
      op => !operations.includes(op),
    );
    expect(
      stale,
      'These entries name no contract operation with a path param. Remove or rename them.',
    ).toEqual([]);
  });
  test.for(cases)(
    '$operation: a non-owner gets 404 and the row is unchanged',
    async ({method, url, body, seed}, t) => {
      const owner = await userSeed.createUser();
      const intruder = await userSeed.createUser();
      const seeded = await seed(owner);
      const before = await seeded.snapshot();

      const app = await build(t, {as: intruder});
      const response = await app.inject({
        method,
        url: url(seeded.id),
        payload: body?.(),
      });

      expect(response.statusCode).toBe(404);
      expect(await seeded.snapshot()).toEqual(before);
    },
  );
});
