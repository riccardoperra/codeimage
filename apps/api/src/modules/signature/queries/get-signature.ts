import {defineQuery, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {type Signature, SignatureErrors} from '../signature.model.js';
import type {SignatureDependencies} from '../signature.repository.js';
export const getSignature = defineQuery<{actor: Actor; id: string}, Signature>(
  'signature.getSignature',
);
export default defineHandler(
  getSignature,
  ({signatures, scopeFor}: SignatureDependencies) =>
    async ({actor, id}) => {
      const signature = await signatures.getSignature(
        scopeFor(actor.userId),
        id,
      );
      if (!signature)
        throw SignatureErrors.notFound({id, ownerId: actor.userId});
      return signature;
    },
);
