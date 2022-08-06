import {Type} from '@sinclair/typebox';
import {FastifyPluginAsync} from 'fastify';
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

const getByIdRoute: FastifyPluginAsync = async fastify => {
  fastify.get<{
    Params: {
      id: string;
    };
  }>('/:id', {preHandler: fastify.authorize, schema}, async request => {
    const {
      params: {id},
    } = request;
    return fastify.projectRepository.findById(id);
  });
};

export default getByIdRoute;
