import {StateEffect, StateField} from '@codemirror/state';
import {Decoration, EditorView, gutter, GutterMarker} from '@codemirror/view';
import {createRoot, createSignal, onCleanup} from 'solid-js';
import {diffCheckboxEvents} from './diffCheckboxEvents';
import {diffTheme} from './diffTheme';
import {DiffCheckbox, DiffCheckboxState} from './DiffCheckbox';
import {container} from './DiffCheckbox.css';

export const diffCheckboxEffect = StateEffect.define<{
  pos: number;
  state: DiffCheckboxState | null;
}>({
  map: (val, mapping) => ({
    pos: mapping.mapPos(val.pos),
    state: val.state,
  }),
});

const diffLineState = StateField.define({
  create() {
    return Decoration.none;
  },
  update(set, transaction) {
    set = set.map(transaction.changes);
    for (const effect of transaction.effects) {
      if (effect.is(diffCheckboxEffect)) {
        const line = transaction.state.doc.lineAt(effect.value.pos);
        const decoration =
          effect.value.state === 'added'
            ? addDecoration
            : effect.value.state === 'removed'
            ? removeDecoration
            : null;
        if (!decoration) {
          set = set.update({filter: from => from !== line.from});
        } else {
          set = set.update({
            add: [decoration.range(line.from, line.from)],
            filter: from => from !== line.from,
          });
        }
        diffCheckboxEvents.emit({
          state: effect.value.state,
          line: line,
        });
      }
    }
    return set;
  },
  provide: field => EditorView.decorations.from(field),
});

const addDecoration = Decoration.line({
  attributes: {class: 'cm-add-line'},
});

const removeDecoration = Decoration.line({
  attributes: {class: 'cm-remove-line'},
});

function setDiffState(
  view: EditorView,
  lineNumber: number,
  state: DiffCheckboxState,
) {
  const line = view.state.doc.line(lineNumber);
  view.dispatch({
    effects: diffCheckboxEffect.of({pos: line.from, state: state}),
  });
}

class DiffCheckboxMarker extends GutterMarker {
  private dispose: VoidFunction | null = null;

  constructor(private readonly lineNumber: number) {
    super();
  }

  eq(other: DiffCheckboxMarker) {
    return this.lineNumber == other.lineNumber;
  }

  destroy(dom: Node) {
    super.destroy(dom);
    this.dispose?.();
  }

  toDOM(view: EditorView): Node {
    return createRoot(dispose => {
      // eslint-disable-next-line solid/reactivity
      this.dispose = dispose;
      const [value, setValue] = createSignal<DiffCheckboxState>('untouched');

      const unsubscribe = diffCheckboxEvents.listen(({state, line}) => {
        if (line.number === this.lineNumber) {
          setValue(state ?? 'untouched');
        }
      });

      onCleanup(() => unsubscribe());

      return (
        <div class={container}>
          <DiffCheckbox
            value={value()}
            onChange={state => setDiffState(view, this.lineNumber, state)}
          />
        </div>
      );
    }) as Node;
  }
}

interface DiffMarkerExtensionOptions {
  readOnly: boolean;
}

export const diffMarkerExtension = (options: DiffMarkerExtensionOptions) => {
  if (options.readOnly) {
    return [diffLineState, diffTheme];
  }
  return [
    diffLineState,
    diffTheme,
    gutter({
      class: 'cm-checkboxMarkerExtension',
      renderEmptyElements: false,
      lineMarker(view, line) {
        return new DiffCheckboxMarker(view.state.doc.lineAt(line.from).number);
      },
      lineMarkerChange: () => false,
      widgetMarker: () => null,
    }),
  ];
};
