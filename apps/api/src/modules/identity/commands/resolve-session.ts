import {defineCommand, defineHandler} from '../../../shared/bus.js';
import type {Actor, SessionClaims} from '../../../shared/principal.js';
import {IdentityErrors} from '../identity.model.js';
import type {UserRepository} from '../identity.repository.js';

export const resolveSession = defineCommand<SessionClaims, Actor>(
  'identity.resolveSession',
);
export default defineHandler(
  resolveSession,
  ({users}: {users: UserRepository}) =>
    async claims => {
      if (claims.email === null) throw IdentityErrors.sessionWithoutEmail();
      const user = await users.upsertByEmail(claims.email);
      return {kind: 'user', userId: user.id, credential: {type: 'session'}};
    },
);
