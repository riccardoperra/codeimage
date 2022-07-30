import {PrismaClient} from '@prisma/client';
import {FastifyPluginAsync} from 'fastify';
import fp from 'fastify-plugin';

// Use TypeScript module augmentation to declare the type of server.prisma to be PrismaClient
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = fp(async server => {
  const prisma = new PrismaClient({
    log: ['query'],
  });

  // @ts-ignore
  prisma.$on('query', e => {
    // @ts-ignore
    console.log('Query: ' + e.query);
    // @ts-ignore
    console.log('Params: ' + e.params);
    // @ts-ignore
    console.log('Duration: ' + e.duration + 'ms');
  });

  await prisma.$connect();

  // Make Prisma Client available through the fastify server instance: server.prisma
  server.decorate('prisma', prisma);

  server.addHook('onClose', async server => {
    await server.prisma.$disconnect();
  });
});

export default prismaPlugin;
