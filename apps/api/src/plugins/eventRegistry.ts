import {FastifyPluginAsync} from 'fastify';
import fp from 'fastify-plugin';
import {EventRegistry} from '../common/domainFunctions/eventRegistry';

declare module 'fastify' {
  interface FastifyInstance {
    eventRegistry: EventRegistry;
  }
}

const eventRegistryPlugin: FastifyPluginAsync = fp(
  async fastify => {
    fastify.decorate('eventRegistry', new EventRegistry());
  },
  {name: 'eventRegistry'},
);

export default eventRegistryPlugin;
