import {Type} from '@sinclair/typebox';
import type {FastifyPluginAsync} from 'fastify';
import type {GetApiTypes} from '../../../common/types/extract-api-types.js';
import {PresetDtoSchema} from '../../../modules/preset/schema/preset-dto.schema.js';

const schema = {
  tags: ['Preset'],
  params: Type.Object({
    id: Type.String(),
  }),
  summary: 'Delete an existing CodeImage preset',
  response: {
    200: PresetDtoSchema,
  },
};

export type DeletePresetApi = GetApiTypes<typeof schema>;

const deleteRoute: FastifyPluginAsync = async fastify => {
  fastify.delete<{
    Params: {id: string};
  }>(
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
      return fastify.presetService.deletePreset(appUser.id, id);
    },
  );
};

export default deleteRoute;
