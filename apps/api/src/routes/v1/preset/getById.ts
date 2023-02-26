import {PresetResponseSchema} from '../../../modules/preset/schema/preset-get-by-id.schema';
import {Type} from '@sinclair/typebox';
import {GetApiTypes} from '../../../common/types/extract-api-types';
import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';

const schema = {
  tags: ['Preset'],
  description: 'Returns a CodeImage preset by id',
  params: Type.Object({
    id: Type.String(),
  }),
  response: {
    200: PresetResponseSchema,
  },
};

export type GetPresetByIdApi = GetApiTypes<typeof schema>;

const getByIdRoute: FastifyPluginAsyncTypebox = async fastify => {
  fastify.get(
    '/:id',
    {
      preValidation: (req, reply) => fastify.authorize(req, reply),
      schema,
    },
    async request => {
      const {
        appUser,
        params: {id},
      } = request;
      return fastify.presetService.findById(appUser.id, id);
    },
  );
};

export default getByIdRoute;
