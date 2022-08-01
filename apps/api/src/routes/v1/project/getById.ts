import {Type} from '@sinclair/typebox';
import {FastifyPluginAsync, FastifySchema} from 'fastify';
import {ProjectGetByIdResponseSchema} from '../../../modules/project/schema/project-get-by-id.schema';

const getByIdRoute: FastifyPluginAsync = async fastify => {
  const schema: FastifySchema = {
    tags: ['Project'],
    description: 'Returns a CodeImage project by id',
    params: Type.Object({
      id: Type.String(),
    }),
    response: {
      200: ProjectGetByIdResponseSchema,
    },
  };

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
