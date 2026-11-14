import {
  createEffect,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
} from 'solid-js';
import './picker.css';

interface PickerProps {
  names: readonly string[];
  active: number;
  onSelect: (index: number) => void;
  onReplay: () => void;
}

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) ||
      target.isContentEditable)
  );
}

// Markup, styles and keys follow the prototype skill's PICKER.md verbatim.
// data-position="top" because the reference editor keeps its frame toolbar
// at the bottom center.
export function Picker(props: PickerProps) {
  let highlight: HTMLSpanElement | undefined;
  const items: HTMLButtonElement[] = [];
  const [ready, setReady] = createSignal(false);
  const count = () => props.names.length;

  const moveHighlight = () => {
    const el = items[props.active];
    if (!el || !highlight) return;
    highlight.style.width = `${el.offsetWidth}px`;
    highlight.style.transform = `translateX(${el.offsetLeft}px)`;
  };

  createEffect(on(() => props.active, moveHighlight));

  const onKeyDown = (e: KeyboardEvent) => {
    if (isEditable(e.target)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= count()) props.onSelect(num - 1);
    else if (e.key === 'ArrowRight')
      props.onSelect((props.active + 1) % count());
    else if (e.key === 'ArrowLeft')
      props.onSelect((props.active - 1 + count()) % count());
    else if (e.key === 'r' || e.key === 'R') props.onReplay();
  };

  onMount(() => {
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', moveHighlight);
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    onCleanup(() => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', moveHighlight);
    });
  });

  return (
    <nav
      class="proto-picker"
      aria-label="Prototype variants"
      data-position="top"
      data-ready={ready() ? '' : undefined}
    >
      <span
        ref={el => (highlight = el)}
        class="proto-picker-highlight"
        aria-hidden="true"
      />
      <For each={props.names}>
        {(name, i) => (
          <button
            ref={el => (items[i()] = el)}
            class="proto-picker-item"
            data-active={i() === props.active ? '' : undefined}
            aria-current={i() === props.active ? 'true' : undefined}
            onClick={() => props.onSelect(i())}
          >
            {name}
          </button>
        )}
      </For>
      <span class="proto-picker-divider" aria-hidden="true" />
      <button
        class="proto-picker-item proto-picker-replay"
        aria-label="Replay animation (R)"
        onClick={() => props.onReplay()}
      >
        ↻
      </button>
    </nav>
  );
}
