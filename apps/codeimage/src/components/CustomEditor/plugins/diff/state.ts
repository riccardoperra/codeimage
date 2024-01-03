import {StateEffect, StateField} from '@codemirror/state';
import {Decoration, EditorView} from '@codemirror/view';
import {diffEvents} from './diffEvents';

export const diffExtensionConstants = {
  decoratedLineDataAttribute: 'data-diff-line',
  lineInserted: 'line-inserted',
  lineDeleted: 'line-deleted',
};
export const insertedLineDecoration = Decoration.line({
  attributes: {
    [diffExtensionConstants.decoratedLineDataAttribute]:
      diffExtensionConstants.lineInserted,
  },
});

export const removedLineDecoration = Decoration.line({
  attributes: {
    [diffExtensionConstants.decoratedLineDataAttribute]:
      diffExtensionConstants.lineDeleted,
  },
});

export type DiffCheckboxState = 'added' | 'removed' | 'untouched';

type DiffLineEffect = {position: number; state: DiffCheckboxState | null};

export const diffLineEffect = StateEffect.define<DiffLineEffect>({
  map: (val, mapping) => ({
    position: mapping.mapPos(val.position),
    state: val.state,
  }),
});

export function dispatchUpdateDiffLineState(
  view: EditorView,
  lineNumber: number,
  state: DiffCheckboxState,
) {
  const line = view.state.doc.line(lineNumber);
  view.dispatch({
    effects: diffLineEffect.of({position: line.from, state: state}),
  });
}

export function getDecorationByState(
  state: DiffCheckboxState | null,
): Decoration | null {
  switch (state) {
    case 'untouched':
      return null;
    case 'added':
      return insertedLineDecoration;
    case 'removed':
      return removedLineDecoration;
    default:
      return null;
  }
}

export const diffLineState = StateField.define({
  create() {
    return Decoration.none;
  },
  update(decorationSet, transaction) {
    decorationSet = decorationSet.map(transaction.changes);
    for (const effect of transaction.effects) {
      if (effect.is(diffLineEffect)) {
        const line = transaction.state.doc.lineAt(effect.value.position);
        const decoration = getDecorationByState(effect.value.state);
        if (!decoration) {
          decorationSet = decorationSet.update({
            filter: from => from !== line.from,
          });
        } else {
          decorationSet = decorationSet.update({
            add: [decoration.range(line.from, line.from)],
            filter: from => from !== line.from,
          });
        }
        diffEvents.emit({
          state: effect.value.state,
          line: line,
        });
      }
    }
    return decorationSet;
  },
  provide: field => EditorView.decorations.from(field) ?? Decoration.none,
});
