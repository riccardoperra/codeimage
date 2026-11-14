import type {Extension} from '@codemirror/state';
import type {LineMarkLabels} from './controls';
import {lineMarkControls} from './controls';
import type {TabMarks} from '../../../../state/editor/model';
import {lineMarksField, lineMarksHistory, marksValue} from './state';
import {lineMarksStyle} from './style';

export function lineMarksExtension(
  interactive: boolean,
  initial: TabMarks,
  labels: LineMarkLabels,
): Extension {
  return [
    lineMarksField.init(state => marksValue(state.doc, initial)),
    lineMarksStyle,
    ...(interactive ? [lineMarksHistory, lineMarkControls(labels)] : []),
  ];
}
