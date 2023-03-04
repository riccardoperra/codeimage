import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {GetApiTypes} from '../../../common/types/extract-api-types';
import {BasePresetResponseSchema} from '../../../modules/preset/schema/preset-get-by-id.schema';
import {PresetBaseRequestSchema} from './../../../modules/preset/schema/preset-update.schema';

const schema = {
  tags: ['Preset'],
  description: 'Update a existing CodeImage preset by id',
  body: PresetBaseRequestSchema,
  params: Type.Object({
    id: Type.String(),
  }),
  response: {
    200: BasePresetResponseSchema,
  },
};

export type UpdatePresetApi = GetApiTypes<typeof schema>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const updateRoute: FastifyPluginAsyncTypebox = async fastify => {
  // fastify.put(
  //   '/:id',
  //   {
  //     preValidation: (req, reply) => fastify.authorize(req, reply),
  //     schema,
  //   },
  //   request => {
  //     const {
  //       appUser,
  //       params: {id},
  //       body,
  //     } = request;
  //     return fastify.presetService.updatePreset(appUser.id, id, body);
  //   },
  // );
};
export default updateRoute;
