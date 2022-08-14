import {FastifyInstance} from 'fastify';
import type {Authenticate} from 'fastify-auth0-verify';
import fp from 'fastify-plugin';

export const auth0Mock = (t: Tap.Test) =>
  fp(async (fastify: FastifyInstance) => {
    const user = t.context.user;

    const auth0Authenticate: Authenticate = async req => {
      const email = user?.email ?? 'test@example.it';
      req.user = {
        [`${process.env.AUTH0_CLIENT_CLAIMS}/email`]: email,
      };
    };

    fastify.decorateRequest('user', null);
    fastify.decorate('authenticate', auth0Authenticate);
  });
