import {
  Annotation,
  EditorState,
  Line,
  Range,
  RangeSetBuilder,
  StateEffect,
  StateField,
  TransactionSpec,
} from '@codemirror/state';
import {Decoration, DecorationSet, EditorView} from '@codemirror/view';
import {customEffectAnnotation} from '../customEffectAnnotation';
import {diffPluginEvents} from './diffEvents';

export const diffExtensionConstants = {
  name: 'diff',
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

type DiffLineEffect = {
  line: number;
  state: DiffCheckboxState | null;
};

type DiffLineReplaceEffect = {
  line: number;
  state: DiffCheckboxState | null;
};

export const diffLineUpdateWithResetAnnotation = Annotation.define<boolean>();

export const diffLineReplacerEffect = StateEffect.define<
  DiffLineReplaceEffect[]
>({
  map: values =>
    values.map(val => ({
      line: val.line,
      state: val.state,
    })),
});

export const diffLineEffect = StateEffect.define<DiffLineEffect>();

export function dispatchUpdateDiffLineState(
  view: EditorView,
  lineNumber: number,
  state: DiffCheckboxState,
) {
  view.dispatch({
    effects: diffLineEffect.of({
      line: lineNumber,
      state: state,
    }),
    annotations: [customEffectAnnotation.of(diffExtensionConstants.name)],
  });
}

export function dispatchReplaceDiffLineState(
  view: EditorView,
  lineNumbersMap: {inserted: number[]; deleted: number[]},
  options: TransactionSpec = {},
) {
  const changes: DiffLineReplaceEffect[] = [
    ...lineNumbersMap.inserted.map(line => ({
      line: line,
      state: 'added' as const,
    })),
    ...lineNumbersMap.deleted.map(line => ({
      line: line,
      state: 'removed' as const,
    })),
  ].sort((a, b) => a.line - b.line);

  view.dispatch({
    userEvent: 'replace-diff-line',
    effects: [diffLineReplacerEffect.of(changes)],
    annotations: [customEffectAnnotation.of(diffExtensionConstants.name)],
    ...options,
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

export class DiffLineStateJsonValue {
  readonly inserted: number[] = [];
  readonly deleted: number[] = [];

  constructor(obj: {inserted: number[]; deleted: number[]}) {
    this.inserted = obj.inserted;
    this.deleted = obj.deleted;
  }

  static fromJSON(
    value: DiffLineStateJsonValue,
    state: EditorState,
  ): DecorationSet {
    console.log('from json');
    const builder = new RangeSetBuilder<Decoration>();
    value.inserted.forEach(inserted => {
      const line = state.doc.line(inserted);
      const add = getDecorationByState('added');
      add && builder.add(line.from, line.from, add);
    });
    value.deleted.forEach(removed => {
      const line = state.doc.line(removed);
      const remove = getDecorationByState('removed');
      remove && builder.add(line.from, line.from, remove);
    });
    return builder.finish();
  }

  static toJSON(
    value: DecorationSet,
    state: EditorState,
  ): DiffLineStateJsonValue {
    const inserted: number[] = [];
    const deleted: number[] = [];
    value.between(0, state.doc.length, (from, to, decoration) => {
      const attr =
        decoration.spec?.attributes[
          diffExtensionConstants.decoratedLineDataAttribute
        ];
      if (!attr) return;
      const line = state.doc.lineAt(from);
      if (attr === diffExtensionConstants.lineInserted) {
        inserted.push(line.number);
      } else if (attr === diffExtensionConstants.lineDeleted) {
        deleted.push(line.number);
      }
    });
    return {inserted, deleted} as DiffLineStateJsonValue;
  }
}

type LineChange = {line: Line; state: DiffCheckboxState};

const pushChange = (changes: LineChange[], change: LineChange) => {
  const existingChange = changes.findIndex(
    existingChange => existingChange.line.number === change.line.number,
  );
  if (existingChange !== -1) {
    changes[existingChange] = change;
  } else {
    changes.push(change);
  }
};

export const diffLineState = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorationSet, transaction) {
    decorationSet = decorationSet.map(transaction.changes);
    const changes: LineChange[] = [];
    const collect = (value: DiffLineEffect) => {
      if (value.line > transaction.state.doc.lines || value.line < 0) {
        return;
      }
      const line = transaction.state.doc.line(value.line);
      pushChange(changes, {line, state: value.state ?? 'untouched'});
    };
    for (const effect of transaction.effects) {
      if (effect.is(diffLineReplacerEffect)) {
        // Reset old lines not present in changes
        const changedLines = effect.value.map(({line}) => line);
        Array.from(
          {length: transaction.state.doc.lines},
          (_, index) => index + 1,
        ).forEach(ln => {
          if (!changedLines.includes(ln)) {
            diffPluginEvents.emit('syncLine', {
              state: 'untouched',
              line: transaction.state.doc.line(ln),
            });
          }
        });
        decorationSet = Decoration.none;
        effect.value.forEach(collect);
      } else if (effect.is(diffLineEffect)) {
        collect(effect.value);
      }
    }

    if (changes.length === 0) {
      return decorationSet;
    }

    const decorations = changes
      // Decorations must be sorted by their position before to be added to the decorationSet
      .sort((a, b) => a.line.number - b.line.number)
      .reduce((acc, change) => {
        if (change.state === 'added') {
          return acc.concat(
            insertedLineDecoration.range(change.line.from, change.line.from),
          );
        } else if (change.state === 'removed') {
          return acc.concat(
            removedLineDecoration.range(change.line.from, change.line.from),
          );
        }
        return acc;
      }, [] as Range<Decoration>[]);

    decorationSet = decorationSet.update({
      add: decorations,
      filter: from => changes.some(change => change.line.from !== from),
    });

    changes.forEach(change => {
      diffPluginEvents.emit('syncLine', change);
    });

    return decorationSet;
  },
  fromJSON(value: DiffLineStateJsonValue, state): DecorationSet {
    return DiffLineStateJsonValue.fromJSON(value, state);
  },
  toJSON(value, state): DiffLineStateJsonValue {
    return DiffLineStateJsonValue.toJSON(value, state);
  },
  provide: field => EditorView.decorations.from(field) ?? Decoration.none,
});
