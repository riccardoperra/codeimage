import {createSignal, For, onCleanup, onMount, Show} from 'solid-js';
import {Portal} from 'solid-js/web';
import {seedSteps} from './seed';
import {setVariant, VARIANTS, variant} from './variant';
import * as styles from './proto.css';

/** Dev-only switcher. Alt+1..6 picks a variant; the seed buttons fill N steps. */
export function ProtoPicker() {
  const [open, setOpen] = createSignal(false);
  onMount(() => {
    const key = (event: KeyboardEvent) => {
      if (!event.altKey) return;
      const match = VARIANTS.find(v => event.code === `Digit${v.key}`);
      if (!match) return;
      event.preventDefault();
      setVariant(match.id);
    };
    window.addEventListener('keydown', key, true);
    onCleanup(() => window.removeEventListener('keydown', key, true));
  });
  const current = () => VARIANTS.find(v => v.id === variant())!;
  return (
    <Portal>
      <div class={styles.picker} data-proto-picker>
        <button
          type="button"
          class={styles.pickerButton}
          aria-pressed="true"
          aria-expanded={open()}
          onClick={() => setOpen(!open())}
        >
          <span class={styles.pickerKey}>{current().key}</span>
          {current().label}{' '}
          <span class={styles.pickerNote}>{current().note}</span>
        </button>
        <Show when={open()}>
          <span class={styles.pickerDivider} />
          <For each={VARIANTS}>
            {v => (
              <button
                type="button"
                class={styles.pickerButton}
                aria-pressed={v.id === variant()}
                title={v.note}
                data-proto-variant={v.id}
                onClick={() => setVariant(v.id)}
              >
                <span class={styles.pickerKey}>{v.key}</span>
                {v.label}
              </button>
            )}
          </For>
          <span class={styles.pickerDivider} />
          <For each={[3, 8, 15, 30]}>
            {n => (
              <button
                type="button"
                class={styles.pickerButton}
                data-proto-seed={n}
                onClick={() => seedSteps(n)}
              >
                {n} steps
              </button>
            )}
          </For>
        </Show>
      </div>
    </Portal>
  );
}
