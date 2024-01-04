import {gutter} from '@codemirror/view';
import {DiffCheckboxMarker} from './diffCheckboxMarker';
import {diffLineState} from './state';
import {theme} from './theme';
import {DiffGutterMarkerStateIcon} from './diffMarkerStateIcon';

interface DiffMarkerExtensionOptions {
  readOnly: boolean;
}

export const diffMarkerStateIconGutter = [
  gutter({
    class: 'cm-diffMarkerStateIconGutter',
    renderEmptyElements: true,
    lineMarker(view, line) {
      return new DiffGutterMarkerStateIcon(
        view.state.doc.lineAt(line.from).number,
      );
    },
    lineMarkerChange: () => false,
    widgetMarker: () => null,
  }),
];

export const diffMarkerControl = (options: DiffMarkerExtensionOptions) => {
  const base = [diffLineState, theme];
  if (options.readOnly) {
    return base;
  }
  return [
    ...base,
    gutter({
      class: 'cm-diffMarkerControlGutter',
      renderEmptyElements: false,
      lineMarker(view, line) {
        return new DiffCheckboxMarker(view.state.doc.lineAt(line.from).number);
      },
      lineMarkerChange: () => false,
      widgetMarker: () => null,
    }),
  ];
};
