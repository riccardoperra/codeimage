import fp from 'fastify-plugin';
import {
  createBus,
  type Bus,
  type Middleware,
  unregisteredActions,
} from '../shared/bus.js';

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
    const command = createBus({middlewares: [logging]});
    const query = createBus({middlewares: [logging]});
    fastify.decorate('commandBus', command);
    fastify.decorate('queryBus', query);
    fastify.addHook('onReady', async () => {
      const missing = unregisteredActions({command, query});
      if (missing.length > 0)
        throw new Error(`No handler registered for: ${missing.join(', ')}`);
    });
  },
  {name: 'bus'},
);
