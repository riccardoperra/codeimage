import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Static, Type} from '@sinclair/typebox';
import {FastifySchema} from 'fastify';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';

const UserInfoSchema = Type.Object({
  id: Type.String(),
  user_id: Type.String(),
  name: Type.String(),
  email: Type.String(),
  created_at: Type.String({format: 'date-time'}),
  email_verified: Type.Boolean(),
  picture: Type.String(),
});

const schema = {
  response: {
    200: UserInfoSchema,
  },
} satisfies FastifySchema;

export type UserInfoApi = GetApiTypes<typeof schema>;

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.addHook(
    'preValidation',
    fastify.authorize({mustBeAuthenticated: true}),
  );
  fastify.get('/info', {schema}, async request => {
    const response = await fastify.auth0Management.usersByEmail.getByEmail({
      email: request.appUser.email,
      fields: 'user_id,name,email,created_at,email_verified,picture',
    });
    return {...response.data[0], id: request.appUser.id} as Static<
      typeof UserInfoSchema
    >;
  });
};

export default route;
