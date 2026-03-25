import {PrismaClient} from '@codeimage/prisma-models/client';
import {PrismaPg} from '@prisma/adapter-pg';
import * as crypto from 'node:crypto';
import {testPresetUtils} from '../__internal__/presetUtils.js';

const adapter = new PrismaPg({
  connectionString: import.meta.env['DATABASE_URL'] || process.env.DATABASE_URL,
});
export const client = new PrismaClient({
  adapter,
});

export const userSeed = {
  clean: async () => await client.user.deleteMany(),
  async createUser(email?: string) {
    const id = crypto.randomUUID();
    return client.user.create({
      data: {
        id,
        email: email || `email-${id}@example.it`,
      },
    });
  },
};

export const presetSeed = {
  clean: async () => await client.preset.deleteMany(),
  async createPresetV1(presetName: string, ownerId: string, data?: object) {
    return client.preset.create({
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
    return client.project.create({
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
