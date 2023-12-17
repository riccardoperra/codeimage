import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';
import {PresetDtoSchema} from '../../../modules/preset/schema/preset-dto.schema.js';

const schema = {
  tags: ['Preset'],
  summary: 'Get all CodeImage presets filtered by current user',
  response: {
    200: Type.Array(PresetDtoSchema),
  },
};

export type GetAllPresetApi = GetApiTypes<typeof schema>;

const getByIdRoute: FastifyPluginAsyncTypebox = async fastify => {
  fastify.addHook(
    'preValidation',
    fastify.authorize({mustBeAuthenticated: true}),
  );
  fastify.get('/', {schema}, async request => {
    const {appUser} = request;
    return fastify.presetService.findAllPresets(appUser.id);
  });
};

export default getByIdRoute;
