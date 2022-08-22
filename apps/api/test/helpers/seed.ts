import {PrismaClient} from '@codeimage/prisma-models';
import * as crypto from 'crypto';
import t from 'tap';

const client = new PrismaClient();

export const getSeeder = () => {
  const cleanSeed = () =>
    t.teardown(async () => {
      await client.$transaction([
        client.project.deleteMany(),
        client.user.deleteMany(),
      ]);
    });

  const setupSeedBefore = (
    seederFn: (client: PrismaClient) => Promise<unknown>,
  ) => {
    t.before(async () => seederFn(client));
  };

  return {
    client,
    setupSeedBefore,
    cleanSeed,
  };
};

export const userSeed = {
  clean: () => client.$transaction([client.user.deleteMany()]),
  createUser(email = `email-${crypto.randomUUID()}@example.it`) {
    return client.user.create({
      data: {
        email: email,
      },
    });
  },
};

export const projectSeed = {
  clean: () => client.$transaction([client.project.deleteMany()]),
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
