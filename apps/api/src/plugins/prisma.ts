import {PrismaClient} from '@codeimage/prisma-models/client';
import {PrismaPg} from '@prisma/adapter-pg';
import type {FastifyPluginAsync} from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = fp(
  async server => {
    const adapter = new PrismaPg({
      connectionString: server.config.DATABASE_URL,
    });
    const prisma = new PrismaClient({
      adapter,
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
