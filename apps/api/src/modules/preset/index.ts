import AutoLoad from '@fastify/autoload';
import fp from 'fastify-plugin';
import {join} from 'node:path';
import * as presets from './preset.repository.js';
import {ownerScope} from '../../shared/db.js';
import type {UserId} from '../../shared/principal.js';
export default fp(
  async fastify => {
    const dependencies = {
      presets,
      scopeFor: (userId: UserId) => ownerScope(fastify.db, userId),
      limit: fastify.config.PRESETS_LIMIT,
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
  {name: 'preset', dependencies: ['db', 'config', 'bus']},
);
export {presetContract} from './preset.contract.js';
export {createPreset} from './commands/create-preset.js';
export {updatePreset} from './commands/update-preset.js';
export {removePreset} from './commands/remove-preset.js';
export {getPreset} from './queries/get-preset.js';
export {listPresets} from './queries/list-presets.js';
