import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {FastifySchema} from 'fastify';
import {Nullable} from '../../../common/typebox/nullable.js';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';

const schema = {
  tags: ['Passkey'],
  summary: 'Initialize a registration for webauthn credentials',
  response: {
    200: Type.Object({
      publicKey: Type.Object({
        rp: Type.Object({
          id: Type.String(),
          name: Type.String(),
          icon: Nullable(Type.String()),
        }),
        user: Type.Object({
          id: Type.String(),
          displayName: Nullable(Type.String()),
          name: Type.String(),
          icon: Nullable(Type.String()),
        }),
        challenge: Type.String(),
        pubKeyCredParams: Nullable(
          Type.Array(
            Type.Object({
              type: Type.String(),
              alg: Type.Number(),
            }),
          ),
        ),
        timeout: Nullable(Type.Number()),
        excludeCredentials: Nullable(
          Type.Array(
            Type.Object({
              type: Type.String(),
              id: Type.String(),
              transports: Nullable(Type.Array(Type.String())),
            }),
          ),
        ),
        authenticatorSelection: Nullable(
          Type.Object({
            authenticatorAttachment: Nullable(Type.String()),
            requireResidentKey: Nullable(Type.Boolean()),
            residentKey: Nullable(Type.String()),
            userVerification: Nullable(Type.String()),
          }),
        ),
        attestation: Nullable(Type.String()),
        extensions: Type.Optional(Type.Any()),
      }),
    }),
  },
} satisfies FastifySchema;

export type PasskeyStartRegistrationApi = GetApiTypes<typeof schema>;

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.addHook(
    'preValidation',
    fastify.authorize({mustBeAuthenticated: true}),
  );
  fastify.post('/registration', {schema}, async request => {
    const {appUser} = request;
    fastify.log.info(
      `Init passkey registration for user with id ${appUser.id}`,
    );
    return fastify.passkeysApi.registration.initialize({
      userId: appUser.id,
      username: appUser.email,
    });
  });
};

export default route;
