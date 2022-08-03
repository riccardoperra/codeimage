import {Static, Type} from '@sinclair/typebox';
import {FastifyPluginAsync} from 'fastify';
import {GetApiTypes} from '../../../common/types/extract-api-types';
import {
  ProjectUpdateRequest,
  ProjectUpdateRequestSchema,
  ProjectUpdateResponseSchema,
} from '../../../modules/project/schema';

const schema = {
  tags: ['Project'],
  description: 'Update an existing CodeImage project',
  body: ProjectUpdateRequestSchema,
  params: Type.Object({
    id: Type.String(),
  }),
  response: {
    200: ProjectUpdateResponseSchema,
  },
};

export type UpdateProjectApi = GetApiTypes<typeof schema>;

const updateRoute: FastifyPluginAsync = async fastify => {
  fastify.put<{
    Body: Static<typeof schema['body']>;
    Params: Static<typeof schema['params']>;
  }>(
    '/:id',
    {
      preHandler: fastify.authorize,
      schema,
    },
    async request => {
      const {
        userId,
        body,
        params: {id},
      } = request;
      // TODO: move to service
      const response = fastify.projectRepository.updateProject(
        userId,
        id,
        // @ts-ignore
        body as ProjectUpdateRequest,
      );
      return response;
    },
  );
};

export default updateRoute;
