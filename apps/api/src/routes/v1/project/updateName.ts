import {Static, Type} from '@sinclair/typebox';
import {FastifyPluginAsync} from 'fastify';
import {GetApiTypes} from '../../../common/types/extract-api-types';
import {BaseProjectResponseSchema} from '../../../modules/project/schema/project.schema';

const schema = {
  tags: ['Project'],
  description: 'Updates `name` of a CodeImage project',
  body: Type.Object({
    name: Type.String(),
  }),
  params: Type.Object({
    id: Type.String(),
  }),
  response: {
    200: BaseProjectResponseSchema,
  },
};

export type UpdateProjectNameApi = GetApiTypes<typeof schema>;

const updateProjectName: FastifyPluginAsync = async fastify => {
  fastify.put<{
    Params: Static<typeof schema['params']>;
    Body: Static<typeof schema['body']>;
  }>(
    '/:id/name',
    {
      preValidation: (req, reply) => fastify.authorize(req, reply),
      schema,
    },
    async request => {
      const {
        body,
        appUser,
        params: {id},
      } = request;
      return fastify.projectService.updateName(appUser.id, id, body.name);
    },
  );
};

export default updateProjectName;
