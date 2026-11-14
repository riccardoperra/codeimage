import {randomUUID} from 'node:crypto';
import type {IncomingMessage} from 'node:http';
import fp from 'fastify-plugin';

const SAFE_REQUEST_ID = /^[\w.-]{1,128}$/;

export function genReqId(request: IncomingMessage): string {
  const header = request.headers['request-id'];
  return typeof header === 'string' && SAFE_REQUEST_ID.test(header)
    ? header
    : randomUUID();
}

export default fp(
  async fastify => {
    fastify.addHook('onSend', async (request, reply) => {
      reply.header('request-id', request.id);
    });
  },
  {name: 'request-id'},
);
