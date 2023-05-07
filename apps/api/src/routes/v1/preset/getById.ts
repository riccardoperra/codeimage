import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';
import {PresetDtoSchema} from '../../../modules/preset/schema/preset-dto.schema.js';

const schema = {
  tags: ['Preset'],
  summary: 'Returns current user preset by id',
  params: Type.Object({
    id: Type.String(),
  }),
  response: {
    200: PresetDtoSchema,
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
      return fastify.presetService.findPresetById(appUser.id, id);
    },
  );
};

export default getByIdRoute;
