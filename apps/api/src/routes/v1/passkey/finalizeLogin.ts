import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {FastifySchema} from 'fastify';
import {Nullable} from '../../../common/typebox/nullable.js';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';

const AuthenticatorResponseSchema = Type.Object({
  clientDataJSON: Type.String(),
});
const AuthenticatorAssertionResponseSchema = Type.Intersect([
  AuthenticatorResponseSchema,
  Type.Object({
    authenticatorData: Type.String(),
    signature: Type.String(),
    userHandle: Nullable(Type.String()),
  }),
]);
const CredentialSchema = Type.Object({
  id: Type.String(),
  type: Type.String(),
});
const PublicKeyCredentialSchema = Type.Intersect([
  CredentialSchema,
  Type.Object({
    rawId: Type.String(),
    clientExtensionResults: Type.Object({}, {additionalProperties: true}),
    authenticatorAttachment: Type.Optional(Type.String()),
  }),
]);

const schema = {
  tags: ['Passkey'],
  summary: 'Finalize the login operation',
  body: Type.Intersect([
    PublicKeyCredentialSchema,
    Type.Object({
      response: AuthenticatorAssertionResponseSchema,
    }),
  ]),
  response: {
    200: Type.Object({
      token: Nullable(Type.String()),
    }),
  },
} satisfies FastifySchema;

export type PasskeyFinalizeLoginApi = GetApiTypes<typeof schema>;

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.post('/finalize-login', {schema}, async request => {
    fastify.log.info(
      `Finalize passkey login for user with id ${request.body.id}`,
    );
    try {
      return await fastify.passkeysApi.login.finalize({
        id: request.body.id,
        type: request.body.type,
        clientExtensionResults: request.body.clientExtensionResults,
        authenticatorAttachment: request.body.authenticatorAttachment,
        rawId: request.body.rawId,
        response: {
          clientDataJSON: request.body.response.clientDataJSON,
          signature: request.body.response.signature,
          userHandle: request.body.response.userHandle,
          authenticatorData: request.body.response.authenticatorData,
        },
      });
    } catch (e) {
      throw fastify.httpErrors.unauthorized(e.originalError.details);
    }
  });
};

export default route;
