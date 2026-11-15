import type {User} from '@codeimage/prisma-models';
import type {TestContext} from 'vitest';
import {mockAuthProvider} from '../../src/plugins/auth0.js';

export const auth0Mock = (t: TestContext & {user?: User}) =>
  mockAuthProvider({email: t.user?.email ?? 'test@example.it'});
