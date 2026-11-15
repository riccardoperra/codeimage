import {createSignal, For, onCleanup, onMount} from 'solid-js';
import * as styles from './picker.css';

// Harness chrome, the same in every project, so not translated.
const NAMES = ['Panel', 'Toolbar', 'Sheet'] as const;
const LABEL = 'Prototype variants';

export type ExportVariant = 1 | 2 | 3;

const requested = import.meta.env.DEV
  ? Number(new URLSearchParams(location.search).get('v'))
  : 1;
const [variant, setVariant] = createSignal<ExportVariant>(
  requested >= 1 && requested <= NAMES.length
    ? (requested as ExportVariant)
    : 1,
);

/** The export variant on show, chosen with the picker; the first by default. */
export const exportVariant = variant;

function select(index: number) {
  const next = ((((index % NAMES.length) + NAMES.length) % NAMES.length) +
    1) as ExportVariant;
  setVariant(next);
  const url = new URL(location.href);
  url.searchParams.set('v', String(next));
  history.replaceState(history.state, '', url);
}

/** Emil Kowalski's prototype picker, at the top so it covers no variant. */
export function ExportVariantPicker() {
  let highlight!: HTMLSpanElement;
  const items: HTMLButtonElement[] = [];
  const [ready, setReady] = createSignal(false);

  const moveHighlight = () => {
    const element = items[variant() - 1];
    if (!element) return;
    highlight.style.width = `${element.offsetWidth}px`;
    highlight.style.transform = `translateX(${element.offsetLeft}px)`;
  };

  onMount(() => {
    moveHighlight();
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) ||
          target.isContentEditable)
      )
        return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const number = parseInt(event.key, 10);
      if (number >= 1 && number <= NAMES.length) select(number - 1);
      else if (event.key === 'ArrowRight') select(variant());
      else if (event.key === 'ArrowLeft') select(variant() - 2);
      else return;
      requestAnimationFrame(moveHighlight);
    };
    document.addEventListener('keydown', keydown);
    window.addEventListener('resize', moveHighlight);
    onCleanup(() => {
      document.removeEventListener('keydown', keydown);
      window.removeEventListener('resize', moveHighlight);
    });
  });

  return (
    <nav
      class={styles.picker}
      aria-label={LABEL}
      data-position="top"
      data-ready={ready() || undefined}
    >
      <span ref={highlight} class={styles.highlight} aria-hidden="true" />
      <For each={NAMES}>
        {(name, index) => (
          <button
            ref={element => (items[index()] = element)}
            class={styles.item}
            data-active={variant() === index() + 1 || undefined}
            aria-current={variant() === index() + 1 ? 'true' : undefined}
            onClick={() => {
              select(index());
              moveHighlight();
            }}
          >
            {name}
          </button>
        )}
      </For>
    </nav>
  );
}
