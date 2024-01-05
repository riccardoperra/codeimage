import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type, type Static} from '@sinclair/typebox';
import {FastifySchema} from 'fastify';
import {Nullable} from '../../../common/typebox/nullable.js';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';
import {enumLiteral} from '../../../common/typebox/enum.js';

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
          displayName: Type.String(),
          name: Type.String(),
          icon: Nullable(Type.String()),
        }),
        challenge: Type.String(),
        pubKeyCredParams: Type.Array(
          Type.Object({
            type: Type.Literal('public-key'),
            alg: Type.Number(),
          }),
        ),
        timeout: Type.Optional(Type.Number()),
        excludeCredentials: Type.Optional(
          Type.Array(
            Type.Object({
              type: Type.Literal('public-key'),
              id: Type.String(),
              transports: Type.Optional(
                Type.Array(
                  enumLiteral([
                    'ble',
                    'hybrid',
                    'internal',
                    'nfc',
                    'usb',
                  ] as const),
                ),
              ),
            }),
          ),
        ),
        authenticatorSelection: Type.Optional(
          Type.Object({
            authenticatorAttachment: Type.Optional(
              enumLiteral(['cross-platform', 'platform']),
            ),
            requireResidentKey: Type.Optional(Type.Boolean()),
            residentKey: Type.Optional(
              enumLiteral(['discouraged', 'preferred', 'required']),
            ),
            userVerification: Type.Optional(
              enumLiteral(['discouraged', 'preferred', 'required']),
            ),
          }),
        ),
        attestation: Type.Optional(
          enumLiteral(['direct', 'enterprise', 'indirect', 'none'] as const),
        ),
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
    const value = fastify.passkeysApi.registration.initialize({
      userId: appUser.id,
      username: appUser.email,
    }) as unknown as Static<(typeof schema)['response'][200]>;
    // const value2 = await fastify.passkeysApi.registration.initialize({
    // userId: appUser.id,
    // username: appUser.email,
    // });
    return value;
  });
};

export default route;
