import {gutter, GutterMarker} from '@codemirror/view';
import {createRoot, createSignal, onCleanup, Show} from 'solid-js';
import {diffCheckboxEvents} from './diff-checkbox-events';
import {DiffCheckboxState} from './DiffCheckbox';

class MarkerStateIcon extends GutterMarker {
  private dispose: VoidFunction | null = null;

  symbols: Record<DiffCheckboxState, string | null> = {
    added: '+',
    removed: '-',
    untouched: null,
  };

  private lastValue: DiffCheckboxState | null = null;

  constructor(public readonly lineNumber: number) {
    super();
  }

  destroy(dom: Node) {
    super.destroy(dom);
    this.dispose?.();
  }

  eq(other: MarkerStateIcon): boolean {
    return other.lineNumber === this.lineNumber;
  }

  toDOM() {
    return createRoot(dispose => {
      // eslint-disable-next-line solid/reactivity
      this.dispose = dispose;
      const [state, setState] = createSignal<DiffCheckboxState>(
        this.lastValue ?? 'untouched',
      );
      const currentSymbol = () => this.symbols[state()];
      const color = () =>
        currentSymbol() === '-'
          ? '#ff226e25'
          : currentSymbol() === '+'
          ? '#12af1225'
          : undefined;

      const unsubscribe = diffCheckboxEvents.listen(({state, line}) => {
        if (line.number === this.lineNumber) {
          setState(state ?? 'untouched');
          this.lastValue = state;
        }
      });

      onCleanup(() => unsubscribe());

      return (
        <div>
          <Show fallback={<div />} when={currentSymbol()}>
            <div
              style={{
                'padding-left': '4px',
                'background-color': color(),
              }}
            >
              {currentSymbol()}
            </div>
          </Show>
        </div>
      ) as Node;
    });
  }
}

export const diffMarkerStateIconGutterExtension = [
  gutter({
    class: 'cm-checkboxMarkerStateIconGutter',
    renderEmptyElements: true,
    lineMarker(view, line) {
      return new MarkerStateIcon(view.state.doc.lineAt(line.from).number);
    },
    lineMarkerChange: () => false,
    widgetMarker: () => null,
  }),
];
