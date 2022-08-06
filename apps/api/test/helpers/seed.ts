import {PrismaClient} from '@codeimage/prisma-models';
import t from 'tap';

export const getSeeder = () => {
  const client = new PrismaClient();

  const cleanSeed = () =>
    t.teardown(async () => {
      await client.$transaction([
        client.project.deleteMany(),
        client.snippetFrame.deleteMany(),
        client.snippetEditorTab.deleteMany(),
        client.snippetEditorOptions.deleteMany(),
        client.snippetTerminal.deleteMany(),
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
