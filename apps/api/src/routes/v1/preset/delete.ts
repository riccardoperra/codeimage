import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';

const schema = {
  tags: ['Preset'],
  params: Type.Object({
    id: Type.String(),
  }),
  summary: 'Delete an existing CodeImage preset',
};

export type DeletePresetApi = GetApiTypes<typeof schema>;

const deleteRoute: FastifyPluginAsyncTypebox = async fastify => {
  fastify.addHook(
    'preValidation',
    fastify.authorize({mustBeAuthenticated: true}),
  );
  fastify.delete('/:id', {schema}, async request => {
    const {
      appUser,
      params: {id},
    } = request;
    await fastify.presetService.deletePreset(appUser.id, id);
  });
};

export default deleteRoute;
