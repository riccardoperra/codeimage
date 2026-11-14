import type {User as UserRow} from '@codeimage/prisma-models';
import type {Db} from '../../shared/db.js';
import {asUserId} from '../../shared/principal.js';
import type {User} from './identity.model.js';

export function createUserRepository(db: Db) {
  return {
    /**
     * Find-or-create by email in one statement. Replaces today's findFirst-then-create, which races
     * when two first requests of a new user arrive together. Idempotent: running it twice is a no-op.
     */
    async upsertByEmail(email: string): Promise<User> {
      const row = await db.user.upsert({
        where: {email},
        create: {email},
        update: {},
      });
      return toUser(row);
    },
  };
}

export type UserRepository = ReturnType<typeof createUserRepository>;

function toUser(row: UserRow): User {
  return {id: asUserId(row.id), email: row.email, createdAt: row.createdAt};
}
