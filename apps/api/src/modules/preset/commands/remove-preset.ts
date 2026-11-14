import {defineCommand, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {type Preset, PresetErrors} from '../preset.model.js';
import type {PresetRepository} from '../preset.repository.js';
export const removePreset = defineCommand<{actor: Actor; id: string}, Preset>(
  'preset.removePreset',
);
export default defineHandler(
  removePreset,
  ({presets}: {presets: PresetRepository}) =>
    async ({actor, id}) => {
      const removed = await presets.ownedBy(actor.userId).remove(id);
      if (!removed) throw PresetErrors.notFound({id, ownerId: actor.userId});
      return removed;
    },
);
