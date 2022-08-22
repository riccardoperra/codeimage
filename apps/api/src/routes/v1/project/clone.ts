import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {GetApiTypes} from '../../../common/types/extract-api-types';
import {ProjectCreateResponseSchema} from '../../../modules/project/schema';

const schema = {
  tags: ['Project'],
  description: 'Clone a CodeImage project from an existing one',
  params: Type.Object({
    id: Type.String(),
  }),
  body: Type.Object({
    newName: Type.Optional(Type.String()),
  }),
  response: {
    200: ProjectCreateResponseSchema,
  },
};

export type CloneProjectApi = GetApiTypes<typeof schema>;

const cloneRoute: FastifyPluginAsyncTypebox = async fastify => {
  fastify.post(
    '/:id/clone',
    {
      preValidation: (req, reply) => fastify.authorize(req, reply),
      schema,
    },
    request => {
      const {appUser, params, body} = request;
      return fastify.projectService.clone(
        appUser,
        params.id,
        body.newName ?? null,
      );
    },
  );
};

export default cloneRoute;
