import fp from 'fastify-plugin';
import project from './project';

export default fp(async fastify => {
  fastify.register(project);
});
