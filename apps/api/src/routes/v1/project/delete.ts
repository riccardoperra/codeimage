import {FastifyPluginAsync} from 'fastify';

const deleteRoute: FastifyPluginAsync = async fastify => {
  fastify.delete<{
    Params: {id: string};
  }>(
    '/:id',
    {
      preHandler: fastify.authorize,
      schema: {
        tags: ['Workspace'],
      },
    },
    async request => {
      const {
        userId,
        params: {id},
      } = request;
      // TODO: move to service
      return fastify.projectRepository.deleteProject(id, userId);
    },
  );
};

export default deleteRoute;
