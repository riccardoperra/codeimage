import {defineQuery, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {type Preset, PresetErrors} from '../preset.model.js';
import type {PresetRepository} from '../preset.repository.js';
export const getPreset = defineQuery<{actor: Actor; id: string}, Preset>(
  'preset.getPreset',
);
export default defineHandler(
  getPreset,
  ({presets}: {presets: PresetRepository}) =>
    async ({actor, id}) => {
      const preset = await presets.ownedBy(actor.userId).get(id);
      if (!preset) throw PresetErrors.notFound({id, ownerId: actor.userId});
      return preset;
    },
);
