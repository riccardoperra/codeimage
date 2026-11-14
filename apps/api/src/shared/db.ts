import type {PrismaClient} from '@codeimage/prisma-models';

export type Db = PrismaClient;

export function isRecordNotFound(error: unknown): boolean {
  return hasPrismaCode(error, 'P2025');
}

export function isUniqueViolation(error: unknown): boolean {
  return hasPrismaCode(error, 'P2002');
}

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
