import {PrismaClient} from '@codeimage/prisma-models';
import * as crypto from 'crypto';
import {testPresetUtils} from '../__internal__/presetUtils.js';

export const client = new PrismaClient({
  datasources: {
    db: {url: 'postgresql://postgres:postgres@localhost:5433/codeimage_test'},
  },
});

export const userSeed = {
  clean: async () => await client.user.deleteMany(),
  async createUser(email?: string) {
    const id = crypto.randomUUID();
    const res = await client.user.create({
      data: {
        id,
        email: email || `email-${id}@example.it`,
      },
    });
    console.log('created user with id', res.id, res.email);
    return res;
  },
};

export const presetSeed = {
  clean: async () => await client.preset.deleteMany(),
  async createPresetV1(presetName: string, ownerId: string, data?: object) {
    return await client.preset.create({
      data: {
        name: presetName,
        owner: {connect: {id: ownerId}},
        version: BigInt(1),
        data: data ?? testPresetUtils.buildPresetData(),
      },
    });
  },
};

export const clearAllSeeds = async () => {
  await projectSeed.clean();
  await presetSeed.clean();
  await userSeed.clean();
};
export const projectSeed = {
  clean: async () => await client.project.deleteMany(),
  async createProject(projectName: string, ownerId: string) {
    return await client.project.create({
      data: {
        name: projectName,
        frame: {create: {}},
        terminal: {
          create: {
            type: 'macOS',
          },
        },
        editorTabs: {
          createMany: {
            data: [{languageId: '1', code: 'code', tabName: 'index.tsx'}],
          },
        },
        editorOptions: {
          create: {
            fontId: 'fontId',
            themeId: 'themeId',
          },
        },
        owner: {
          connect: {id: ownerId},
        },
      },
      include: {
        owner: true,
        editorTabs: true,
        frame: true,
        terminal: true,
        editorOptions: true,
        _count: true,
      },
    });
  },
};
