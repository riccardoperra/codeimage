import {defineQuery, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {type Preset} from '../preset.model.js';
import type {PresetDependencies} from '../preset.repository.js';
export const listPresets = defineQuery<{actor: Actor}, Preset[]>(
  'preset.listPresets',
);
export default defineHandler(
  listPresets,
  ({presets, scopeFor}: PresetDependencies) =>
    async ({actor}) => {
      return presets.listPresets(scopeFor(actor.userId));
    },
);
