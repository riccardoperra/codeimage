import {defineCommand, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {
  type Preset,
  type PresetChanges,
  PresetErrors,
} from '../preset.model.js';
import type {PresetRepository} from '../preset.repository.js';
export const updatePreset = defineCommand<
  {actor: Actor; id: string; changes: PresetChanges},
  Preset
>('preset.updatePreset');
export default defineHandler(
  updatePreset,
  ({presets}: {presets: PresetRepository}) =>
    async ({actor, id, changes}) => {
      const updated = await presets.ownedBy(actor.userId).update(id, changes);
      if (!updated) throw PresetErrors.notFound({id, ownerId: actor.userId});
      return updated;
    },
);
