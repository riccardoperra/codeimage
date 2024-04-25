import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {FastifySchema} from 'fastify/types/schema.js';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';
import {PresetCreateDtoSchema} from '../../../modules/preset/schema/preset-create-dto.schema.js';
import {PresetDtoSchema} from '../../../modules/preset/schema/preset-dto.schema.js';

const schema = {
  tags: ['Preset'],
  operationId: 'Create',
  summary: 'Create a new CodeImage Preset',
  body: PresetCreateDtoSchema,
  response: {
    200: PresetDtoSchema,
  },
} satisfies FastifySchema;

export type CreatePresetApi = GetApiTypes<typeof schema>;

// eslint-disable-next-line
const createRoute: FastifyPluginAsyncTypebox = async fastify => {
  fastify.addHook(
    'preValidation',
    fastify.authorize({mustBeAuthenticated: true}),
  );
  fastify.post('/', {schema}, request => {
    const {appUser, body} = request;
    return fastify.presetService.createPreset(appUser.id, body);
  });
};

export default createRoute;
