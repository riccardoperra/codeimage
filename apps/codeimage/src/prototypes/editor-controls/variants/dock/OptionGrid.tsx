import type {JSX} from 'solid-js';
import {createMemo, createSelector, For, onMount} from 'solid-js';
import {isKeyboardClick, keepFromPicker, useDock} from './context';
import type {Previewable} from './preview';

interface OptionGridProps<T> {
  label: string;
  items: readonly T[];
  id: (item: T) => string;
  selected: (item: T) => boolean;
  change: (item: T) => Previewable;
  onPick: (item: T, byKeyboard: boolean) => void;
  children: (item: T) => JSX.Element;
  class?: string;
  optionClass?: string;
  /** Typing while an option has focus continues in this field. */
  search?: () => HTMLInputElement | undefined;
  autofocus?: boolean;
}

const isPrintable = (event: KeyboardEvent) =>
  event.key.length === 1 &&
  event.key !== ' ' &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.altKey;

function neighbour(
  options: HTMLElement[],
  from: HTMLElement,
  key: string,
): HTMLElement | undefined {
  const index = options.indexOf(from);
  switch (key) {
    case 'ArrowRight':
      return options[index + 1];
    case 'ArrowLeft':
      return options[index - 1];
    case 'Home':
      return options[0];
    case 'End':
      return options[options.length - 1];
  }
  // Up and down go by position, because the column count follows the width.
  const origin = from.getBoundingClientRect();
  const down = key === 'ArrowDown';
  let best: {option: HTMLElement; rows: number; columns: number} | undefined;
  for (const option of options) {
    const rect = option.getBoundingClientRect();
    const rows = down ? rect.top - origin.top : origin.top - rect.top;
    if (rows < 1) continue;
    const columns = Math.abs(rect.left - origin.left);
    if (
      !best ||
      rows < best.rows - 1 ||
      (Math.abs(rows - best.rows) <= 1 && columns < best.columns)
    ) {
      best = {option, rows, columns};
    }
  }
  return best?.option;
}

/**
 * A listbox laid out as a grid. Moving focus or the mouse over an option
 * previews it on the canvas. Enter or a click keeps it.
 */
export function OptionGrid<T>(props: OptionGridProps<T>) {
  const dock = useDock();
  let grid!: HTMLDivElement;

  const selectedId = () => {
    const item = props.items.find(props.selected);
    return item === undefined ? undefined : props.id(item);
  };
  // `selected` follows the store, and the store follows the preview. The
  // check mark must stay on the value that Escape goes back to.
  const committedId = createMemo<string | undefined>(previous =>
    dock.previewKey() === undefined ? selectedId() : previous,
  );
  const isCommitted = createSelector(committedId);
  const isPreviewed = createSelector(dock.previewKey);

  const options = () =>
    Array.from(grid.querySelectorAll<HTMLElement>('[role="option"]'));

  const highlight = (item: T) => {
    if (props.id(item) === committedId()) dock.session.cancel();
    else dock.session.preview(props.change(item));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const from = event.target as HTMLElement;
    if (isPrintable(event)) {
      keepFromPicker(event);
      props.search?.()?.focus();
      return;
    }
    if (
      ![
        'ArrowRight',
        'ArrowLeft',
        'ArrowDown',
        'ArrowUp',
        'Home',
        'End',
      ].includes(event.key)
    ) {
      return;
    }
    event.preventDefault();
    keepFromPicker(event);
    const next = neighbour(options(), from, event.key);
    if (next) next.focus();
    else if (event.key === 'ArrowUp') props.search?.()?.focus();
  };

  onMount(() => {
    if (!props.autofocus) return;
    const all = options();
    const start = all.find(option => option.dataset.selected !== undefined);
    (start ?? all[0])?.focus({preventScroll: false});
  });

  const tabStop = () => committedId() ?? props.items.map(props.id)[0];

  return (
    <div
      ref={grid}
      role="listbox"
      aria-label={props.label}
      class={props.class}
      onKeyDown={onKeyDown}
      onPointerLeave={event => {
        if (event.pointerType === 'mouse') dock.session.cancel();
      }}
    >
      <For each={props.items}>
        {item => {
          const id = props.id(item);
          return (
            <button
              type="button"
              role="option"
              class={props.optionClass}
              aria-selected={isCommitted(id)}
              data-selected={isCommitted(id) ? '' : undefined}
              data-previewed={
                isPreviewed(props.change(item).key) ? '' : undefined
              }
              tabIndex={tabStop() === id ? 0 : -1}
              onFocus={() => highlight(item)}
              onPointerEnter={event => {
                if (event.pointerType === 'mouse') highlight(item);
              }}
              onClick={event => {
                dock.keep(props.change(item));
                props.onPick(item, isKeyboardClick(event));
              }}
            >
              {props.children(item)}
            </button>
          );
        }}
      </For>
    </div>
  );
}
