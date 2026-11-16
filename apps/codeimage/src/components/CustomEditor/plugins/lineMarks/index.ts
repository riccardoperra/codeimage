import './marks.css';
import type {Owner} from 'solid-js';
import {lineMarksNews} from './news';
import type {Extension} from '@codemirror/state';
import type {LineMarkLabels} from './controls';
import {lineMarkControls} from './controls';
import {lineMarkGutter} from './gutter';
import type {TabMarks} from '../../../../state/editor/model';
import {spoilerLayer} from './spoilerLayer';
import {lineMarksField, lineMarksHistory, marksValue} from './state';

export function lineMarksExtension(
  interactive: boolean,
  initial: TabMarks,
  labels: LineMarkLabels,
  owner?: Owner,
): Extension {
  return [
    lineMarksField.init(state => marksValue(state.doc, initial)),
    spoilerLayer,
    ...(interactive && owner ? [lineMarksNews(owner)] : []),
    ...(interactive
      ? [lineMarksHistory, lineMarkControls(labels), lineMarkGutter(labels)]
      : []),
  ];
}
