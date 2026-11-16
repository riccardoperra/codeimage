import type {Extension} from '@codemirror/state';
import {keymap} from '@codemirror/view';
import {lineMarkKeymap, type LineMarkLabels} from './commands';
import {selectionToolbar} from './selection-toolbar';
import {gutterPreviewField, gutterDrag} from './gutter-drag';
import {controlsTheme} from './controls-theme';

export {
  lineMarkKeymap,
  markCommands,
  selectedLines,
  shortcutKeys,
  type LineMarkLabels,
} from './commands';
export {selectionBar, selectionFocus} from './selection-toolbar';
export {popupArea, popupTooltips} from './popup';
export {gutterMarkPointerDown, lineAtHeight} from './gutter-drag';

export function lineMarkControls(labels: LineMarkLabels): Extension {
  return [
    selectionToolbar(labels),
    gutterPreviewField,
    gutterDrag,
    controlsTheme,
    keymap.of(lineMarkKeymap),
  ];
}
