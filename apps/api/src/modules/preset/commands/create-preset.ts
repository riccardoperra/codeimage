import {defineCommand, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {
  type Preset,
  type PresetDraft,
  exceedsPresetLimit,
  PresetErrors,
} from '../preset.model.js';
import type {PresetRepository} from '../preset.repository.js';
export const createPreset = defineCommand<
  {actor: Actor; draft: PresetDraft},
  Preset
>('preset.createPreset');
export default defineHandler(
  createPreset,
  ({presets, limit}: {presets: PresetRepository; limit: number}) =>
    async ({actor, draft}) => {
      const mine = presets.ownedBy(actor.userId);
      if (exceedsPresetLimit(await mine.count(), limit))
        throw PresetErrors.limitExceeded({limit});
      return mine.create(draft);
    },
);
