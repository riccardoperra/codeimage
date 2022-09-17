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
      preValidation: (req, reply) => fastify.authorize(req, reply),
      schema,
    },
    async request => {
      const {
        appUser,
        params: {id},
      } = request;
      return fastify.projectRepository.deleteProject(id, appUser.id);
    },
  );
};

export default deleteRoute;
