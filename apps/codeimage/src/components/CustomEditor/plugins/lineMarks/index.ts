import './marks.css';
import type {Owner} from 'solid-js';
import {lineMarksNews, mountLineMarksNews} from './news';
import type {Extension} from '@codemirror/state';
import type {LineMarkLabels} from './controls';
import {lineMarkControls} from './controls';
import {lineMarkGutter} from './gutter';
import {lineMarksHistory} from './state';

export function lineMarksExtension(
  interactive: boolean,
  labels: LineMarkLabels,
  owner?: Owner,
): Extension {
  return [
    ...(interactive && owner ? [lineMarksNews(owner)] : []),
    ...(interactive
      ? [
          lineMarksHistory,
          lineMarkControls(labels),
          lineMarkGutter(
            labels,
            owner ? host => mountLineMarksNews(host, owner) : undefined,
          ),
        ]
      : []),
  ];
}
