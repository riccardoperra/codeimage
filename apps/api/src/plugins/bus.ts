import fp from 'fastify-plugin';
import {createBus, type Bus, type Middleware} from '../shared/bus.js';

declare module 'fastify' {
  interface FastifyInstance {
    commandBus: Bus;
    queryBus: Bus;
  }
}

export default fp(
  async fastify => {
    const logging: Middleware = async (action, next) => {
      const start = performance.now();
      try {
        const result = await next();
        fastify.log.info(
          {
            action: action.name,
            duration: performance.now() - start,
            outcome: 'success',
          },
          'Use case completed',
        );
        return result;
      } catch (err) {
        fastify.log.warn(
          {
            action: action.name,
            duration: performance.now() - start,
            outcome: 'failure',
            err,
          },
          'Use case failed',
        );
        throw err;
      }
    };
    fastify.decorate('commandBus', createBus({middlewares: [logging]}));
    fastify.decorate('queryBus', createBus({middlewares: [logging]}));
  },
  {name: 'bus'},
);
