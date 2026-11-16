import type {ControlId} from '../../model';
import type {PanelId} from './panels';

// Rendering and reveal share this map; a new control must have a panel.
type Group =
  | 'frame'
  | 'signature'
  | 'header'
  | 'surface'
  | 'language'
  | 'lines'
  | 'family'
  | 'font';
type Place = {
  readonly panel: Exclude<PanelId, 'themes' | 'presets'>;
  readonly group: Group;
};
const frame = {panel: 'frame', group: 'frame'} satisfies Place;
const signature = {panel: 'frame', group: 'signature'} satisfies Place;
const header = {panel: 'window', group: 'header'} satisfies Place;
const surface = {panel: 'window', group: 'surface'} satisfies Place;
const language = {panel: 'code', group: 'language'} satisfies Place;
const lines = {panel: 'code', group: 'lines'} satisfies Place;
const font = {panel: 'code', group: 'font'} satisfies Place;

export const PLACES = {
  'frame.visible': frame,
  'frame.padding': frame,
  'frame.radius': frame,
  'frame.opacity': frame,
  'frame.aspectRatio': frame,
  'frame.background': frame,
  'frame.backgroundImage': frame,
  'signature.saved': signature,
  'signature.handle': signature,
  'signature.style': signature,
  'signature.platform': signature,
  'signature.name': signature,
  'signature.avatar': signature,
  'signature.profile': signature,
  'signature.position': signature,
  'window.header': header,
  'window.style': header,
  'window.accent': header,
  'window.surface': surface,
  'window.backgroundType': surface,
  'window.reflection': surface,
  'window.watermark': surface,
  'window.border': surface,
  'window.shadow': surface,
  'editor.language': language,
  'editor.theme': language,
  'editor.formatter': language,
  'editor.lineNumbers': lines,
  'editor.lineNumberStart': lines,
  'font.family': {panel: 'code', group: 'family'},
  'font.weight': font,
  'font.ligatures': font,
} satisfies Record<ControlId, Place>;

export function controlsIn(group: Group): ControlId[] {
  return Object.keys(PLACES)
    .filter((id): id is ControlId => Object.hasOwn(PLACES, id))
    .filter(id => PLACES[id].group === group);
}
