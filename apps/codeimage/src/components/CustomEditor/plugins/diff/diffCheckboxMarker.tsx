import {EditorView, GutterMarker} from '@codemirror/view';
import {createRoot, createSignal, onCleanup} from 'solid-js';
import {DiffCheckbox, DiffCheckboxState} from './DiffCheckbox';
import {container} from './DiffCheckbox.css';
import {events} from './events';
import {dispatchUpdateDiffLineState} from './state';

export class DiffCheckboxMarker extends GutterMarker {
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

      const unsubscribe = events.listen(({state, line}) => {
        if (line.number === this.lineNumber) {
          setValue(state ?? 'untouched');
        }
      });

      onCleanup(() => unsubscribe());

      return (
        <div class={container}>
          <DiffCheckbox
            value={value()}
            onChange={state =>
              dispatchUpdateDiffLineState(view, this.lineNumber, state)
            }
          />
        </div>
      );
    }) as Node;
  }
}
