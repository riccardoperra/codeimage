/**
 * Persistence mechanism shared by repositories. The only Prisma-aware file outside `*.repository.ts`
 * and `plugins/db.ts` (architecture test). Prisma types never leave this file and the repositories:
 * repositories return domain types.
 */
import type {PrismaClient} from '@codeimage/prisma-models';

/** The database handle a repository factory receives. Decorated as `fastify.db` by plugins/db.ts. */
export type Db = PrismaClient;

/** Prisma P2025: the row a unique-keyed write targeted does not exist. Duck-typed: no runtime Prisma import. */
export function isRecordNotFound(error: unknown): boolean {
  return hasPrismaCode(error, 'P2025');
}

/** Prisma P2002: unique constraint violation. */
export function isUniqueViolation(error: unknown): boolean {
  return hasPrismaCode(error, 'P2002');
}

/**
 * For one-row writes keyed by a compound unique such as `id_ownerId`: a missing row and a row owned by
 * someone else look the same to the database, so both resolve to null. One query, no read-then-write.
 */
export async function orNull<T>(write: Promise<T>): Promise<T | null> {
  try {
    return await write;
  } catch (error) {
    if (isRecordNotFound(error)) return null;
    throw error;
  }
}

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as {code: unknown}).code === code
  );
}
