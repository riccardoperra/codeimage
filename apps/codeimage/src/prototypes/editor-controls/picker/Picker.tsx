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

// Widgets that use arrows, digits or letters themselves: fields, and the
// lists, menus, dialogs and other composites the page renders or opens.
const KEY_OWNERS = [
  'input',
  'textarea',
  'select',
  '[role="listbox"]',
  '[role="menu"]',
  '[role="menubar"]',
  '[role="dialog"]',
  '[role="alertdialog"]',
  '[role="combobox"]',
  '[role="grid"]',
  '[role="tree"]',
  '[role="radiogroup"]',
  '[role="tablist"]',
  '[role="slider"]',
  '[role="spinbutton"]',
].join(', ');

// A list, menu, dialog or combobox the page opened, wherever focus is.
const OPEN_POPUP =
  '[aria-haspopup]:not([aria-haspopup="false"])[aria-expanded="true"], [role="combobox"][aria-expanded="true"]';

function pageOwnsKey(event: KeyboardEvent): boolean {
  const target = event.target;
  return (
    event.defaultPrevented ||
    (target instanceof HTMLElement &&
      (target.isContentEditable || target.closest(KEY_OWNERS) !== null)) ||
    document.querySelector(OPEN_POPUP) !== null
  );
}

// Markup and styles follow the prototype skill's PICKER.md verbatim. The keys
// follow it too, and also step aside for the page's own lists and popups.
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
    if (pageOwnsKey(e)) return;
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
