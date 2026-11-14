import type {FastifyRequest} from 'fastify';
import type {OperationConfig} from './contract.js';
import {CommonErrors} from './errors.js';
import type {Actor, Principal} from './principal.js';

declare module 'fastify' {
  interface FastifyRequest {
    principal: Principal;
  }

  interface FastifyContextConfig extends OperationConfig {}
}

export function actorOf(request: FastifyRequest): Actor {
  if (request.principal.kind !== 'user') {
    throw CommonErrors.unauthenticated();
  }
  return request.principal;
}
