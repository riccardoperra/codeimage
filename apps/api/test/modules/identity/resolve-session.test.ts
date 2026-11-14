import {expect, test} from 'vitest';
import handler from '../../../src/modules/identity/commands/resolve-session.js';
import {asUserId} from '../../../src/shared/principal.js';

test('resolves verified claims to a session actor', async () => {
  const user = {
    id: asUserId('user'),
    email: 'user@example.it',
    createdAt: new Date(),
  };
  const resolve = handler.factory({
    users: {upsertByEmail: async email => ({...user, email})},
  });
  expect(await resolve({email: user.email})).toEqual({
    kind: 'user',
    userId: user.id,
    credential: {type: 'session'},
  });
});

test('invalid claims never reach persistence', async () => {
  const resolve = handler.factory({
    users: {
      upsertByEmail: async () => {
        throw new Error('unexpected persistence');
      },
    },
  });
  await expect(resolve({email: null})).rejects.toMatchObject({
    code: 'SESSION_WITHOUT_EMAIL',
    message: 'No valid user data',
  });
});
