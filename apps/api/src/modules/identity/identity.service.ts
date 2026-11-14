import type {Actor, SessionClaims} from '../../shared/principal.js';
import {IdentityErrors} from './identity.model.js';
import type {UserRepository} from './identity.repository.js';

export interface IdentityServiceDeps {
  readonly users: UserRepository;
}

export function createIdentityService({users}: IdentityServiceDeps) {
  return {
    async actorFromSession(claims: SessionClaims): Promise<Actor> {
      if (claims.email === null) throw IdentityErrors.sessionWithoutEmail();
      const user = await users.upsertByEmail(claims.email);
      return {kind: 'user', userId: user.id, credential: {type: 'session'}};
    },
  };
}
export type IdentityService = ReturnType<typeof createIdentityService>;
