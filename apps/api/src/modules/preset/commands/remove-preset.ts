import {defineCommand, defineHandler} from '../../../shared/bus.js';
import type {Actor} from '../../../shared/principal.js';
import {type Preset, PresetErrors} from '../preset.model.js';
import type {PresetDependencies} from '../preset.repository.js';
export const removePreset = defineCommand<{actor: Actor; id: string}, Preset>(
  'preset.removePreset',
);
export default defineHandler(
  removePreset,
  ({presets, scopeFor}: PresetDependencies) =>
    async ({actor, id}) => {
      const removed = await presets.removePreset(scopeFor(actor.userId), id);
      if (!removed) throw PresetErrors.notFound({id, ownerId: actor.userId});
      return removed;
    },
);
