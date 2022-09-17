import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {GetApiTypes} from '../../../common/types/extract-api-types';
import {ProjectGetByIdResponseSchema} from '../../../modules/project/schema';

const schema = {
  tags: ['Project'],
  description: 'Returns a CodeImage project by id',
  params: Type.Object({
    id: Type.String(),
  }),
  response: {
    200: ProjectGetByIdResponseSchema,
  },
};

export type GetProjectByIdApi = GetApiTypes<typeof schema>;

const getByIdRoute: FastifyPluginAsyncTypebox = async fastify => {
  fastify.get(
    '/:id',
    {
      preValidation: (req, reply) =>
        fastify.authorize(req, reply, {
          mustBeAuthenticated: false,
        }),
      schema,
    },
    async request => {
      const {
        appUser,
        params: {id},
      } = request;
      return fastify.projectService.findById(appUser, id);
    },
  );
};

export default getByIdRoute;
