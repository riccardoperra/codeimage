import {defineCommand, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {
  type Signature,
  type SignatureDraft,
  reachesSignatureLimit,
  SignatureErrors,
} from '../signature.model.js';
import type {SignatureDependencies} from '../signature.repository.js';
export const createSignature = defineCommand<
  {actor: Actor; draft: SignatureDraft},
  Signature
>('signature.createSignature');
export default defineHandler(
  createSignature,
  ({signatures, scopeFor, limit}: SignatureDependencies & {limit: number}) =>
    async ({actor, draft}) => {
      const scope = scopeFor(actor.userId);
      if (reachesSignatureLimit(await signatures.countSignatures(scope), limit))
        throw SignatureErrors.limitExceeded({limit});
      return signatures.createSignature(scope, draft);
    },
);
