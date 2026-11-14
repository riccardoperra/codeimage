import {defineCommand, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {
  type Preset,
  type PresetChanges,
  PresetErrors,
} from '../preset.model.js';
import type {PresetDependencies} from '../preset.repository.js';
export const updatePreset = defineCommand<
  {actor: Actor; id: string; changes: PresetChanges},
  Preset
>('preset.updatePreset');
export default defineHandler(
  updatePreset,
  ({presets, scopeFor}: PresetDependencies) =>
    async ({actor, id, changes}) => {
      const updated = await presets.updatePreset(
        scopeFor(actor.userId),
        id,
        changes,
      );
      if (!updated) throw PresetErrors.notFound({id, ownerId: actor.userId});
      return updated;
    },
);
