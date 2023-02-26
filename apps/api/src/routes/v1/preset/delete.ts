import {Type} from '@sinclair/typebox';
import {FastifyPluginAsync} from 'fastify';
import {GetApiTypes} from '../../../common/types/extract-api-types';

const schema = {
  tags: ['Preset'],
  params: Type.Object({
    id: Type.String(),
  }),
  description: 'Delete an existing CodeImage preset',
  response: {
    200: Type.Void(),
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
      fastify.presetService.deletePreset(appUser.id, id);
    },
  );
};

export default deleteRoute;
