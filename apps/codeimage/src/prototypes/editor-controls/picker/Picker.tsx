import {
  createEffect,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';
import './picker.css';

/** The item a key selects, `replay`, or undefined to leave the key to the page. */
export type PickerKeys = (
  key: string,
  active: number,
  count: number,
) => number | 'replay' | undefined;

interface PickerProps {
  /** Accessible name of the pill. */
  label: string;
  names: readonly string[];
  active: number;
  onSelect: (index: number) => void;
  keys: PickerKeys;
  /** Shows the replay button. */
  onReplay?: () => void;
  /** Dims the pill and ignores its keys. */
  disabled?: boolean;
}

/** Number keys, the arrows, and R to replay: the layout picker of PICKER.md. */
export const numberKeys: PickerKeys = (key, active, count) => {
  const num = parseInt(key, 10);
  if (num >= 1 && num <= count) return num - 1;
  if (key === 'ArrowRight') return (active + 1) % count;
  if (key === 'ArrowLeft') return (active - 1 + count) % count;
  if (key === 'r' || key === 'R') return 'replay';
  return undefined;
};

/** The first letter of each name, and [ and ] to step, for a second picker. */
export const letterKeys =
  (names: readonly string[]): PickerKeys =>
  (key, active, count) => {
    if (key === '[') return (active - 1 + count) % count;
    if (key === ']') return (active + 1) % count;
    const index = names.findIndex(
      name => name[0].toLowerCase() === key.toLowerCase(),
    );
    return index >= 0 ? index : undefined;
  };

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

// A widget marked data-passes-keys stops the keys it uses itself, so the
// rest reach the pickers unless a widget around it owns them.
function insideOwner(element: Element | null): boolean {
  const owner = element?.closest(KEY_OWNERS);
  if (!owner) return false;
  return owner.hasAttribute('data-passes-keys')
    ? insideOwner(owner.parentElement)
    : true;
}

function pageOwnsKey(event: KeyboardEvent): boolean {
  const target = event.target;
  return (
    event.defaultPrevented ||
    (target instanceof HTMLElement &&
      (target.isContentEditable || insideOwner(target))) ||
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
    if (props.disabled || pageOwnsKey(e)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const target = props.keys(e.key, props.active, count());
    if (target === 'replay') props.onReplay?.();
    else if (target !== undefined) props.onSelect(target);
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
      aria-label={props.label}
      data-position="top"
      data-ready={ready() ? '' : undefined}
      data-disabled={props.disabled ? '' : undefined}
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
            disabled={props.disabled}
            onClick={() => props.onSelect(i())}
          >
            {name}
          </button>
        )}
      </For>
      <Show when={props.onReplay}>
        {replay => (
          <>
            <span class="proto-picker-divider" aria-hidden="true" />
            <button
              class="proto-picker-item proto-picker-replay"
              aria-label="Replay animation (R)"
              onClick={() => replay()()}
            >
              ↻
            </button>
          </>
        )}
      </Show>
    </nav>
  );
}
