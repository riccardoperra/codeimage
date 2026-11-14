/**
 * Identity: who a credential belongs to. Owns the users table (today written by plugins/auth0.ts).
 * Has no HTTP routes.
 */
import {defineErrors} from '../../shared/errors.js';
import type {UserId} from '../../shared/principal.js';

export interface User {
  readonly id: UserId;
  readonly email: string;
  readonly createdAt: Date;
}

export const IdentityErrors = defineErrors({
  /** Code is new; status and message are today's (`400 'No valid user data'`). */
  sessionWithoutEmail: {
    code: 'SESSION_WITHOUT_EMAIL',
    kind: 'invalid',
    message: () => 'No valid user data',
  },
});
