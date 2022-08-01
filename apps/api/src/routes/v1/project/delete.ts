import {Type} from '@sinclair/typebox';
import {FastifyPluginAsync, FastifySchema} from 'fastify';
import {ProjectDeleteResponseSchema} from '../../../modules/project/schema';

const deleteRoute: FastifyPluginAsync = async fastify => {
  const schema: FastifySchema = {
    tags: ['Project'],
    params: Type.Object({
      id: Type.String(),
    }),
    response: {
      200: ProjectDeleteResponseSchema,
    },
  };

  fastify.delete<{
    Params: {id: string};
  }>(
    '/:id',
    {
      preHandler: fastify.authorize,
      schema,
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
