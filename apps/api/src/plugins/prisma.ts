import {PrismaClient} from '@codeimage/prisma-models';
import {FastifyPluginAsync} from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = fp(
  async server => {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: server.config.DATABASE_URL,
        },
      },
    });

    await prisma.$connect();

    server.decorate('prisma', prisma);

    server.addHook('onClose', async server => {
      await server.prisma.$disconnect();
    });
  },
  {name: 'prisma'},
);

export default prismaPlugin;
