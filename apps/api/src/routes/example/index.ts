import {FastifyPluginAsync} from 'fastify';

const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/', async function (request, reply) {
    return 'this is an example';
  });
};

export default example;
