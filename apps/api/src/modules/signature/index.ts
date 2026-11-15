import AutoLoad from '@fastify/autoload';
import fp from 'fastify-plugin';
import {join} from 'node:path';
import * as signatures from './signature.repository.js';
import {ownerScope} from '../../shared/db.js';
import type {UserId} from '../../shared/principal.js';
export default fp(
  async fastify => {
    const dependencies = {
      signatures,
      scopeFor: (userId: UserId) => ownerScope(fastify.db, userId),
      limit: fastify.config.SIGNATURES_LIMIT,
    };
    for (const kind of ['commands', 'queries']) {
      await fastify.register(AutoLoad, {
        dir: join(import.meta.dirname, kind),
        options: dependencies,
        forceESM: true,
        ignorePattern: /\.d\.[cm]?ts$/,
      });
    }
  },
  {name: 'signature', dependencies: ['db', 'config', 'bus']},
);
export {signatureContract} from './signature.contract.js';
export {createSignature} from './commands/create-signature.js';
export {updateSignature} from './commands/update-signature.js';
export {removeSignature} from './commands/remove-signature.js';
export {getSignature} from './queries/get-signature.js';
export {listSignatures} from './queries/list-signatures.js';
