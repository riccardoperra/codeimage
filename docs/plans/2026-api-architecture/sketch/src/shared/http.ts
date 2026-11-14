/**
 * The HTTP edge's shared vocabulary: what a route handler may read from a request.
 * Imported by `*.routes.ts`, `http/` and plugins. Never by models or services (architecture test):
 * use cases receive an Actor, not a request.
 */
import type {FastifyRequest} from 'fastify';
import type {OperationConfig} from './contract.js';
import {CommonErrors} from './errors.js';
import type {Actor, Principal} from './principal.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by the API's auth hook before validation. Anonymous only on `auth: 'optional'` routes. */
    principal: Principal;
  }

  /** Route `config` is the contract's OperationConfig, so the auth mode declared in a contract is typed here. */
  interface FastifyContextConfig extends OperationConfig {}
}

/**
 * The authenticated actor of a route with `auth: 'required'` (the default).
 * The auth hook already rejected anonymous callers; this narrows the type and fails closed
 * if a route's auth mode and its handler disagree.
 */
export function actorOf(request: FastifyRequest): Actor {
  if (request.principal.kind !== 'user') {
    throw CommonErrors.unauthenticated();
  }
  return request.principal;
}
