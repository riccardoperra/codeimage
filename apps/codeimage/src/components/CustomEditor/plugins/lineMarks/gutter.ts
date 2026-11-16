import {Prec, type Extension} from '@codemirror/state';
import {gutter} from '@codemirror/view';
import type {LineMarkLabels} from './commands';
import {gutterState} from './gutter-state';
import {
  gutterMarkHover,
  gutterMarkLeave,
  gutterPointer,
} from './gutter-pointer';
import {createPlacement} from './placement';
import {Marker} from './marker';
import {createMarkerField} from './marker-field';
import {createNewsField} from './news-field';
import {createMenuField} from './menu-field';
import {lineMarksField} from './state';
import './gutter.css';

export {gutterAction, gutterState, menuLines} from './gutter-state';
export {attachLineMarkEntry} from './gutter-navigation';
export {gutterMarkHover, gutterMarkLeave} from './gutter-pointer';

export function lineMarkGutter(
  labels: LineMarkLabels,
  mountNews?: (host: HTMLElement) => () => void,
): Extension {
  const placement = createPlacement();
  const environment = {labels, placement};
  const markerTooltips = createMarkerField(environment);
  return [
    gutterState,
    markerTooltips,
    createNewsField(placement, mountNews),
    createMenuField(labels, placement),
    gutterPointer(),
    Prec.highest(
      gutter({
        class: 'cm-lineMarkGutter',
        domEventHandlers: {
          pointermove: gutterMarkHover,
          pointerout: gutterMarkLeave,
        },
        lineMarker(view, line) {
          if (view.state.readOnly) return null;
          const number = view.state.doc.lineAt(line.from).number;
          return (
            view.state
              .field(markerTooltips)
              .markers.find(marker => marker.line === number) ??
            new Marker(
              {
                line: number,
                kind: undefined,
                focused: false,
                hovered: false,
                active: false,
                keyboardFocus: false,
                open: false,
                news: false,
              },
              environment,
            )
          );
        },
        lineMarkerChange: update =>
          update.startState.field(gutterState) !==
            update.state.field(gutterState) ||
          update.startState.field(lineMarksField) !==
            update.state.field(lineMarksField) ||
          update.startState.readOnly !== update.state.readOnly,
      }),
    ),
  ];
}
