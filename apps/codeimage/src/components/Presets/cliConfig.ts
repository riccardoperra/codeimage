import type {PresetData} from '@codeimage/store/presets/types';

type PresetSections = Pick<PresetData, 'frame' | 'terminal' | 'editor'>;

export function toCliConfig({frame, terminal, editor}: PresetSections) {
  return JSON.stringify({frame, terminal, editor}, null, 2);
}
