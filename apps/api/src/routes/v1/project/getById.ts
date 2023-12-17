import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';
import {ProjectGetByIdResponseSchema} from '../../../modules/project/schema/index.js';

const schema = {
  tags: ['Project'],
  summary: 'Returns a CodeImage project by id',
  params: Type.Object({
    id: Type.String(),
  }),
  response: {
    200: ProjectGetByIdResponseSchema,
  },
};

export type GetProjectByIdApi = GetApiTypes<typeof schema>;

const getByIdRoute: FastifyPluginAsyncTypebox = async fastify => {
  fastify.addHook(
    'preValidation',
    fastify.authorize({mustBeAuthenticated: false}),
  );
  fastify.get('/:id', {schema}, async request => {
    const {
      appUser,
      params: {id},
    } = request;
    return fastify.projectService.findById(appUser, id);
  });
};

export default getByIdRoute;
