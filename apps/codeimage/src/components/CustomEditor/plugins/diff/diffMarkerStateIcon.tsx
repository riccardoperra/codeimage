import {backgroundColorVar} from '@codeimage/ui';
import {GutterMarker} from '@codemirror/view';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {Show, createRoot, createSignal, onCleanup} from 'solid-js';
import {DiffCheckboxState} from './DiffCheckbox';
import {diffPluginEvents} from './diffEvents';
import * as styles from './diffMarkerStateIcon.css';
import {colors} from './theme';

interface MarkerStateSymbolOption {
  label: string;
  color: string;
}

export class DiffGutterMarkerStateIcon extends GutterMarker {
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

  eq(other: DiffGutterMarkerStateIcon): boolean {
    return other.lineNumber === this.lineNumber;
  }

  toDOM() {
    return createRoot(dispose => {
      // eslint-disable-next-line solid/reactivity
      this.dispose = dispose;
      const [state, setState] = createSignal<DiffCheckboxState>('untouched');
      const currentSymbol = () => this.symbols[state()];

      const unsubscribe = diffPluginEvents.on('syncLine', ({state, line}) => {
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
                {currentSymbol().label}
              </div>
            )}
          </Show>
        </div>
      ) as Node;
    });
  }
}
