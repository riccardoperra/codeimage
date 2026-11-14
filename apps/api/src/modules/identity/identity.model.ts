import {defineErrors} from '../../shared/errors.js';
import type {UserId} from '../../shared/principal.js';

export interface User {
  readonly id: UserId;
  readonly email: string;
  readonly createdAt: Date;
}

export const IdentityErrors = defineErrors({
  sessionWithoutEmail: {
    code: 'SESSION_WITHOUT_EMAIL',
    kind: 'invalid',
    message: () => 'No valid user data',
  },
});
