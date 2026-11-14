/**
 * Request ids for support and public clients.
 * - Accept a client `request-id` header only when it is a short plain token; otherwise mint a UUID.
 *   (Fastify's `requestIdHeader` would trust any value, so app.ts disables it and uses `genReqId`.)
 * - Echo the id on every response as `request-id`. The error envelope carries it as `requestId`,
 *   and Fastify's logger already binds it to every request log line as `reqId`.
 */
import {randomUUID} from 'node:crypto';
import type {IncomingMessage} from 'node:http';
import fp from 'fastify-plugin';

const SAFE_REQUEST_ID = /^[\w.-]{1,128}$/;

/** Used by app.ts `options.genReqId`. */
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
