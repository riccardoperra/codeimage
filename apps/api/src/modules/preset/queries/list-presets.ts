import {defineQuery, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {type Preset} from '../preset.model.js';
import type {PresetRepository} from '../preset.repository.js';
export const listPresets = defineQuery<{actor: Actor}, Preset[]>(
  'preset.listPresets',
);
export default defineHandler(
  listPresets,
  ({presets}: {presets: PresetRepository}) =>
    async ({actor}) => {
      return presets.ownedBy(actor.userId).list();
    },
);
