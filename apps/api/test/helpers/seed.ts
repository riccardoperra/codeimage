import {PrismaClient} from '@codeimage/prisma-models';
import * as crypto from 'crypto';
import {testPresetUtils} from '../__internal__/presetUtils.js';

const client = new PrismaClient({
  datasources: {
    db: {url: 'postgresql://postgres:postgres@localhost:5433/codeimage_test'},
  },
});

export const userSeed = {
  clean: () => client.user.deleteMany().then(),
  createUser(email = `email-${crypto.randomUUID()}@example.it`) {
    return client.user.create({
      data: {
        email: email,
      },
    });
  },
};

export const presetSeed = {
  clean: () => client.preset.deleteMany().then(),
  createPresetV1(presetName: string, ownerId: string, data?: object) {
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

export const projectSeed = {
  clean: () => client.project.deleteMany().then(),
  createProject(projectName: string, ownerId: string) {
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
        owner: {connect: {id: ownerId}},
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
