import {PrismaClient} from '@codeimage/prisma-models/client';
import {PrismaPg} from '@prisma/adapter-pg';
import fp from 'fastify-plugin';
import type {Db} from '../shared/db.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: Db;
  }
}

export default fp(
  async fastify => {
    const db = new PrismaClient({
      adapter: new PrismaPg({connectionString: fastify.config.DATABASE_URL}),
    });
    await db.$connect();
    fastify.decorate('db', db);
    fastify.addHook('onClose', async () => {
      await db.$disconnect();
    });
  },
  {name: 'db', dependencies: ['config']},
);
