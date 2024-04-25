import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';
import {
  ProjectUpdateRequestSchema,
  ProjectUpdateResponseSchema,
} from '../../../modules/project/schema/index.js';

const schema = {
  tags: ['Project'],
  summary: 'Update an existing CodeImage project',
  body: ProjectUpdateRequestSchema,
  params: Type.Object({
    id: Type.String(),
  }),
  response: {
    200: ProjectUpdateResponseSchema,
  },
};

export type UpdateProjectApi = GetApiTypes<typeof schema>;

const updateRoute: FastifyPluginAsyncTypebox = async fastify => {
  fastify.addHook(
    'preValidation',
    fastify.authorize({mustBeAuthenticated: true}),
  );
  fastify.put('/:id', {schema}, request => {
    const {
      appUser,
      body,
      params: {id},
    } = request;
    return fastify.projectService.update(appUser.id, id, body);
  });
};

export default updateRoute;
