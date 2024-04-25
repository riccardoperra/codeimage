import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';
import {ProjectDeleteResponseSchema} from '../../../modules/project/schema/index.js';

const schema = {
  tags: ['Project'],
  params: Type.Object({
    id: Type.String(),
  }),
  summary: 'Delete an existing CodeImage project',
  response: {
    200: ProjectDeleteResponseSchema,
  },
};

export type DeleteProjectApi = GetApiTypes<typeof schema>;

const deleteRoute: FastifyPluginAsyncTypebox = async fastify => {
  fastify.addHook(
    'preValidation',
    fastify.authorize({mustBeAuthenticated: true}),
  );
  fastify.delete('/:id', {schema}, async request => {
    const {
      appUser,
      params: {id},
    } = request;
    return fastify.projectRepository.deleteProject(id, appUser.id);
  });
};

export default deleteRoute;
