import {backgroundColorVar} from '@codeimage/ui';
import {gutter, GutterMarker} from '@codemirror/view';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createRoot, createSignal, onCleanup, Show} from 'solid-js';
import {diffCheckboxEvents} from './diffCheckboxEvents';
import {colors} from './diffTheme';
import {DiffCheckboxState} from './DiffCheckbox';
import * as styles from './diffMarkerStateIcon.css';

interface MarkerStateSymbolOption {
  label: string;
  color: string;
}

class MarkerStateIcon extends GutterMarker {
  private dispose: VoidFunction | null = null;

  symbols: Record<DiffCheckboxState, MarkerStateSymbolOption | null> = {
    added: {label: '+', color: colors.addLine},
    removed: {label: '-', color: colors.removeLine},
    untouched: null,
  };

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
      // TODO: add initial state
      const [state, setState] = createSignal<DiffCheckboxState>('untouched');
      const currentSymbol = () => this.symbols[state()];

      const unsubscribe = diffCheckboxEvents.listen(({state, line}) => {
        if (line.number === this.lineNumber) {
          setState(state ?? 'untouched');
        }
      });

      onCleanup(() => unsubscribe());

      return (
        <div class={styles.wrapper}>
          <Show fallback={<div />} when={currentSymbol()}>
            {currentSymbol => (
              <div
                class={styles.icon}
                style={assignInlineVars({
                  [backgroundColorVar]: currentSymbol().color,
                })}
              >
                {currentSymbol()?.label}
              </div>
            )}
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
