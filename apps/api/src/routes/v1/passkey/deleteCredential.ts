import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {FastifySchema} from 'fastify';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';

const schema = {
  params: Type.Object({
    credentialId: Type.String(),
  }),
} satisfies FastifySchema;

export type DeleteCredentialApi = GetApiTypes<typeof schema>;

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.addHook(
    'preValidation',
    fastify.authorize({mustBeAuthenticated: true}),
  );
  fastify.delete(
    '/credentials/:credentialId',
    {
      schema: {
        params: Type.Object({
          credentialId: Type.String(),
        }),
      },
    },
    async request => {
      return fastify.passkeysApi
        .credential(request.params.credentialId)
        .remove();
    },
  );
};

export default route;
