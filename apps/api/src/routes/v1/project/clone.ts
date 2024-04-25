import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';
import {ProjectCreateResponseSchema} from '../../../modules/project/schema/index.js';

const schema = {
  tags: ['Project'],
  summary: 'Clone a CodeImage project from an existing one',
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
  fastify.addHook(
    'preValidation',
    fastify.authorize({mustBeAuthenticated: true}),
  );
  fastify.post('/:id/clone', {schema}, request => {
    const {appUser, params, body} = request;
    return fastify.projectService.clone(
      appUser,
      params.id,
      body.newName ?? null,
    );
  });
};

export default cloneRoute;
