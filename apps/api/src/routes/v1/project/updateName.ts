import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';
import {BaseProjectResponseSchema} from '../../../modules/project/schema/project.schema.js';

const schema = {
  tags: ['Project'],
  summary: 'Updates `name` of a CodeImage project',
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

const updateProjectName: FastifyPluginAsyncTypebox = async fastify => {
  fastify.addHook(
    'preValidation',
    fastify.authorize({mustBeAuthenticated: true}),
  );
  fastify.put('/:id/name', {schema}, async request => {
    const {
      body,
      appUser,
      params: {id},
    } = request;
    return fastify.projectService.updateName(appUser.id, id, body.name);
  });
};

export default updateProjectName;
