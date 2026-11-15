import {defineCommand, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {
  type Signature,
  type SignatureChanges,
  SignatureErrors,
} from '../signature.model.js';
import type {SignatureDependencies} from '../signature.repository.js';
export const updateSignature = defineCommand<
  {actor: Actor; id: string; changes: SignatureChanges},
  Signature
>('signature.updateSignature');
export default defineHandler(
  updateSignature,
  ({signatures, scopeFor}: SignatureDependencies) =>
    async ({actor, id, changes}) => {
      const updated = await signatures.updateSignature(
        scopeFor(actor.userId),
        id,
        changes,
      );
      if (!updated) throw SignatureErrors.notFound({id, ownerId: actor.userId});
      return updated;
    },
);
