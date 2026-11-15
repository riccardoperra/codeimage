import {defineQuery, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {type Signature} from '../signature.model.js';
import type {SignatureDependencies} from '../signature.repository.js';
export const listSignatures = defineQuery<{actor: Actor}, Signature[]>(
  'signature.listSignatures',
);
export default defineHandler(
  listSignatures,
  ({signatures, scopeFor}: SignatureDependencies) =>
    async ({actor}) => {
      return signatures.listSignatures(scopeFor(actor.userId));
    },
);
