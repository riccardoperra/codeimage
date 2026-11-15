import {defineCommand, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {type Signature, SignatureErrors} from '../signature.model.js';
import type {SignatureDependencies} from '../signature.repository.js';
export const removeSignature = defineCommand<
  {actor: Actor; id: string},
  Signature
>('signature.removeSignature');
export default defineHandler(
  removeSignature,
  ({signatures, scopeFor}: SignatureDependencies) =>
    async ({actor, id}) => {
      const removed = await signatures.removeSignature(
        scopeFor(actor.userId),
        id,
      );
      if (!removed) throw SignatureErrors.notFound({id, ownerId: actor.userId});
      return removed;
    },
);
