import {User} from '@codeimage/prisma-models';
import {TestContext} from 'vitest';
import {mockAuthProvider} from '../../src/plugins/auth0.js';

export const auth0Mock = <T extends {user: User}>(t: TestContext & T) =>
  mockAuthProvider(t.user);
