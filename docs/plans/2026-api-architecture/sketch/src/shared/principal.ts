/**
 * Who is calling. The auth hook in http/app-api.ts produces a Principal (through the identity module);
 * services consume an Actor. Framework-free: no Fastify, no Prisma.
 *
 * The one ownership-critical primitive is UserId. It is branded so a raw string from a URL,
 * a body, or a query cannot be passed where an owner is expected. Resource ids (preset id,
 * project id) are deliberately NOT branded: any string is a valid lookup key, and the owner
 * scope, not the id, is what protects a row.
 */

declare const userIdBrand: unique symbol;

/** A users.id that came from an authenticated principal or from a database row. */
export type UserId = string & {readonly [userIdBrand]: true};

/**
 * Brands a raw id. Callers: `*.repository.ts` (ids read from rows) and test helpers.
 * The architecture test fails on any other caller.
 */
export function asUserId(raw: string): UserId {
  return raw as UserId;
}

/**
 * How the actor proved who it is. Today only the first-party Auth0 session exists.
 * The public API adds a second variant here (a machine credential acting for its owner). Every
 * consumer of Actor is unaffected: services read `actor.userId`, never the credential.
 */
export type Credential = {readonly type: 'session'};

/**
 * An authenticated caller. Every owner-scoped use case takes an Actor, never a Principal,
 * so an anonymous caller cannot reach a write: the compiler rejects it.
 */
export interface Actor {
  readonly kind: 'user';
  readonly userId: UserId;
  readonly credential: Credential;
}

export interface Anonymous {
  readonly kind: 'anonymous';
}

export const anonymous: Anonymous = Object.freeze({kind: 'anonymous'});

/** What a route with `auth: 'optional'` sees. */
export type Principal = Actor | Anonymous;

/** Credentials as they arrive from the session verifier, before identity resolves a user. */
export interface SessionClaims {
  /** The `${AUTH0_CLIENT_CLAIMS}/email` claim. null when the token carries none. */
  readonly email: string | null;
}

/** Ownership as a read-side fact (for `isOwner` flags). Writes never use this: they go through `ownedBy`. */
export function isOwnedBy(principal: Principal, ownerId: UserId): boolean {
  return principal.kind === 'user' && principal.userId === ownerId;
}
