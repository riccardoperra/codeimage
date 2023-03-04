import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {GetApiTypes} from '../../../common/types/extract-api-types';
import {PresetResponseSchema} from '../../../modules/preset/schema/preset-get-by-id.schema';
import {PresetBaseRequestSchema} from '../../../modules/preset/schema/preset-update.schema';

const schema = {
  tags: ['Preset'],
  description: 'Create a new CodeImage Preset',
  body: PresetBaseRequestSchema,
  response: {
    200: PresetResponseSchema,
  },
};

export type CreatePresetApi = GetApiTypes<typeof schema>;

// eslint-disable-next-line
const createRoute: FastifyPluginAsyncTypebox = async fastify => {
  // fastify.post(
  //   '/',
  //   {
  //     preValidation: (req, reply) => fastify.authorize(req, reply),
  //     schema,
  //   },
  //   request => {
  //     const {appUser, body} = request;
  //     return fastify.presetService.createPreset(appUser.id, body);
  //   },
  // );
};

export default createRoute;
