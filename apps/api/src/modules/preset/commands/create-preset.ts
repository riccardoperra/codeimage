import {defineCommand, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {
  type Preset,
  type PresetDraft,
  exceedsPresetLimit,
  PresetErrors,
} from '../preset.model.js';
import type {PresetDependencies} from '../preset.repository.js';
export const createPreset = defineCommand<
  {actor: Actor; draft: PresetDraft},
  Preset
>('preset.createPreset');
export default defineHandler(
  createPreset,
  ({presets, scopeFor, limit}: PresetDependencies & {limit: number}) =>
    async ({actor, draft}) => {
      const scope = scopeFor(actor.userId);
      if (exceedsPresetLimit(await presets.countPresets(scope), limit))
        throw PresetErrors.limitExceeded({limit});
      return presets.createPreset(scope, draft);
    },
);
