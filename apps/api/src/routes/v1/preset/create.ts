import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {GetApiTypes} from '../../../common/types/extract-api-types';
import {PresetCreateDtoSchema} from '../../../modules/preset/schema/preset-create-dto.schema';
import {PresetDtoSchema} from '../../../modules/preset/schema/preset-dto.schema';

const schema = {
  tags: ['Preset'],
  description: 'Create a new CodeImage Preset',
  body: PresetCreateDtoSchema,
  response: {
    200: PresetDtoSchema,
  },
};

export type CreatePresetApi = GetApiTypes<typeof schema>;

// eslint-disable-next-line
const createRoute: FastifyPluginAsyncTypebox = async fastify => {
  fastify.post(
    '/',
    {
      preValidation: (req, reply) => fastify.authorize(req, reply),
      schema,
    },
    request => {
      const {appUser, body} = request;
      return fastify.presetService.createPreset(appUser.id, body);
    },
  );
};

export default createRoute;
