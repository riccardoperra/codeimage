import type * as repository from './signature.repository.js';
import type {Signature as SignatureRow} from '@codeimage/prisma-models';
import {type OwnerScope, orNull} from '../../shared/db.js';
import {asUserId, type UserId} from '../../shared/principal.js';
import type {
  Signature,
  SignatureChanges,
  SignatureDraft,
} from './signature.model.js';

export async function getSignature(
  scope: OwnerScope,
  id: string,
): Promise<Signature | null> {
  const row = await scope.client.signature.findUnique({
    where: {id_ownerId: {id, ownerId: scope.ownerId}},
  });
  return row ? toSignature(row) : null;
}

export async function listSignatures(scope: OwnerScope): Promise<Signature[]> {
  const rows = await scope.client.signature.findMany({
    where: {ownerId: scope.ownerId},
    orderBy: {createdAt: 'asc'},
  });
  return rows.map(toSignature);
}

export function countSignatures(scope: OwnerScope): Promise<number> {
  return scope.client.signature.count({where: {ownerId: scope.ownerId}});
}

// One default per owner: making a signature the default clears the others
// in the same transaction.
export async function createSignature(
  scope: OwnerScope,
  draft: SignatureDraft,
): Promise<Signature> {
  const create = scope.client.signature.create({
    data: {
      name: draft.name,
      data: draft.data,
      isDefault: draft.isDefault ?? false,
      owner: {connect: {id: scope.ownerId}},
    },
  });
  if (!draft.isDefault) return toSignature(await create);
  const [, row] = await scope.client.$transaction([
    scope.client.signature.updateMany({
      where: {ownerId: scope.ownerId, isDefault: true},
      data: {isDefault: false},
    }),
    create,
  ]);
  return toSignature(row);
}

export async function updateSignature(
  scope: OwnerScope,
  id: string,
  changes: SignatureChanges,
): Promise<Signature | null> {
  const update = scope.client.signature.update({
    where: {id_ownerId: {id, ownerId: scope.ownerId}},
    data: {
      name: changes.name,
      data: changes.data,
      isDefault: changes.isDefault,
      version: {increment: 1},
    },
  });
  if (!changes.isDefault) {
    const row = await orNull(update);
    return row ? toSignature(row) : null;
  }
  const result = await orNull(
    scope.client.$transaction([
      scope.client.signature.updateMany({
        where: {ownerId: scope.ownerId, isDefault: true, NOT: {id}},
        data: {isDefault: false},
      }),
      update,
    ]),
  );
  return result ? toSignature(result[1]) : null;
}

export async function removeSignature(
  scope: OwnerScope,
  id: string,
): Promise<Signature | null> {
  const row = await orNull(
    scope.client.signature.delete({
      where: {id_ownerId: {id, ownerId: scope.ownerId}},
    }),
  );
  return row ? toSignature(row) : null;
}

export type SignatureRepository = typeof repository;

export interface SignatureDependencies {
  readonly signatures: SignatureRepository;
  readonly scopeFor: (userId: UserId) => OwnerScope;
}

function toSignature(row: SignatureRow): Signature {
  const data = row.data;
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`Signature ${row.id}: data column is not a JSON object`);
  }
  return {
    id: row.id,
    ownerId: asUserId(row.ownerId),
    name: row.name,
    isDefault: row.isDefault,
    version: Number(row.version),
    data,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
