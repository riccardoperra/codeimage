import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {FastifySchema} from 'fastify';
import {Nullable} from '../../../common/typebox/nullable.js';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';

const AuthenticatorResponseSchema = Type.Object({
  clientDataJSON: Type.String(),
});
const AuthenticatorAttestationResponseSchema = Type.Intersect([
  AuthenticatorResponseSchema,
  Type.Object({
    attestationObject: Type.String(),
    transports: Nullable(Type.Array(Type.String())),
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
    authenticatorAttachment: Nullable(Type.String()),
  }),
]);

const schema = {
  tags: ['Passkey'],
  summary: 'Finish credential registration process',
  body: Type.Intersect([
    PublicKeyCredentialSchema,
    Type.Object({
      response: AuthenticatorAttestationResponseSchema,
      transports: Nullable(Type.Array(Type.String())),
    }),
  ]),
  response: {
    200: Type.Object({
      token: Type.Optional(Type.String()),
    }),
  },
} satisfies FastifySchema;

export type PasskeyFinalizeRegistrationApi = GetApiTypes<typeof schema>;

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.addHook(
    'preValidation',
    fastify.authorize({mustBeAuthenticated: true}),
  );
  fastify.post('/finalize-registration', {schema}, async request => {
    // const {appUser} = request;
    return fastify.passkeysApi.registration.finalize({
      rawId: request.body.rawId,
      type: request.body.type,
      transports: request.body.transports,
      authenticatorAttachment: request.body.authenticatorAttachment,
      id: request.body.id,
      clientExtensionResults: request.body.clientExtensionResults,
      response: {
        transports: request.body.response.transports,
        clientDataJSON: request.body.response.clientDataJSON,
        attestationObject: request.body.response.attestationObject,
      },
    });
  });
};

export default route;
