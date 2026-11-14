import type {Actor, SessionClaims} from '../../shared/principal.js';
import {IdentityErrors} from './identity.model.js';
import type {UserRepository} from './identity.repository.js';

export interface IdentityServiceDeps {
  readonly users: UserRepository;
}

export function createIdentityService({users}: IdentityServiceDeps) {
  return {
    /**
     * First-party session → Actor. Provisions the user row on first sight, as today.
     * A verified session without an email claim is a 400 (today's behavior), even on optional routes.
     */
    async actorFromSession(claims: SessionClaims): Promise<Actor> {
      if (claims.email === null) throw IdentityErrors.sessionWithoutEmail();
      const user = await users.upsertByEmail(claims.email);
      return {kind: 'user', userId: user.id, credential: {type: 'session'}};
    },
  };
}

export type IdentityService = ReturnType<typeof createIdentityService>;
