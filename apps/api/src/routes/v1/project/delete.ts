import {Type} from '@sinclair/typebox';
import {FastifyPluginAsync, FastifySchema} from 'fastify';
import {GetApiTypes} from '../../../common/types/extract-api-types';
import {ProjectDeleteResponseSchema} from '../../../modules/project/schema';

const schema = {
  tags: ['Project'],
  params: Type.Object({
    id: Type.String(),
  }),
  response: {
    200: ProjectDeleteResponseSchema,
  },
};

export type DeleteProjectApi = GetApiTypes<typeof schema>;

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
      return fastify.projectRepository.deleteProject(id, userId);
    },
  );
};

export default deleteRoute;
