/**
 * The database handle. Renamed from `fastify.prisma` to `fastify.db` and typed as `Db`.
 *
 * Who may read `fastify.db`: module `index.ts` files (to pass it to a repository factory) and plugins.
 * Routes and services may not (architecture test, which also catches `const {db} = fastify`). No decorator ever
 * exposes a repository, so a route has no handle that can write a row without an owner scope.
 */
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
