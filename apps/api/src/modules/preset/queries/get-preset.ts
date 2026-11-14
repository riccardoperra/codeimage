import {defineQuery, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {type Preset, PresetErrors} from '../preset.model.js';
import type {PresetDependencies} from '../preset.repository.js';
export const getPreset = defineQuery<{actor: Actor; id: string}, Preset>(
  'preset.getPreset',
);
export default defineHandler(
  getPreset,
  ({presets, scopeFor}: PresetDependencies) =>
    async ({actor, id}) => {
      const preset = await presets.getPreset(scopeFor(actor.userId), id);
      if (!preset) throw PresetErrors.notFound({id, ownerId: actor.userId});
      return preset;
    },
);
