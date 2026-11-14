import {
  createPreset,
  updatePreset,
} from '../../src/modules/preset/preset.repository.js';
import {renameProject} from '../../src/modules/project/project.repository.js';
import {ownerScope, type Db, type OwnerScope} from '../../src/shared/db.js';
import type {UserId} from '../../src/shared/principal.js';
import type {PresetDraft} from '../../src/modules/preset/preset.model.js';

export function checkOwnerTypes(db: Db, userId: UserId, draft: PresetDraft) {
  const scope = ownerScope(db, userId);
  createPreset(scope, draft);
  // @ts-expect-error A plain client does not carry an owner.
  createPreset(db, draft);
  // @ts-expect-error An owner id alone does not carry a client.
  createPreset(userId, draft);
  // @ts-expect-error A raw string cannot authorize a write.
  renameProject('owner', 'id', 'name');
  // @ts-expect-error A plain client cannot authorize an update.
  updatePreset(db, 'id', {name: 'name', data: {}});
  // @ts-expect-error The private brand cannot be supplied structurally.
  const forged: OwnerScope = {client: db, ownerId: userId};
  // @ts-expect-error Scope creation requires a named owner.
  ownerScope(db);
  // @ts-expect-error Scope creation requires a UserId.
  ownerScope(db, 'owner');
  return forged;
}
