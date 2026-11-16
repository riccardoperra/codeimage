import {timelineActions} from './actions';
import type {TimelineStep} from './model';

const focusKey = (root: HTMLElement | undefined, key: string) =>
  requestAnimationFrame(() =>
    root
      ?.querySelector<HTMLElement>(`[data-nav="${CSS.escape(key)}"]`)
      ?.focus(),
  );

export function navKeyDown(
  event: KeyboardEvent,
  options: {
    root: HTMLElement | undefined;
    step: TimelineStep;
    kind: 'hold' | 'transition';
  },
) {
  const actions = timelineActions();
  const target = event.currentTarget as HTMLElement;
  const next = ['ArrowRight', 'ArrowDown'].includes(event.key);
  const previous = ['ArrowLeft', 'ArrowUp'].includes(event.key);
  if (event.altKey && (next || previous)) {
    event.preventDefault();
    event.stopPropagation();
    const to = options.step.tab - 1 + (next ? 1 : -1);
    if (to < 0 || to >= actions.tabCount()) return;
    actions.moveTab(options.step.editorId, to);
    const key = target.dataset.nav;
    if (key) focusKey(options.root, key);
    return;
  }
  if (
    options.kind === 'hold' &&
    (event.key === 'Delete' || event.key === 'Backspace')
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (actions.canRemoveStep(options.step)) actions.removeStep(options.step);
    return;
  }
  if (!next && !previous && event.key !== 'Home' && event.key !== 'End') return;
  event.preventDefault();
  event.stopPropagation();
  const items = [
    ...(options.root?.querySelectorAll<HTMLElement>('[data-nav]') ?? []),
  ];
  const index = items.indexOf(target);
  const to = navigationIndex(event.key, {length: items.length, index, next});
  items[to]?.focus();
}

export const tabStopOf = (
  selected: string | null,
  key: string,
  first: string,
) => ((selected ?? first) === key ? 0 : -1);

function navigationIndex(
  key: string,
  {length, index, next}: {length: number; index: number; next: boolean},
) {
  if (key === 'Home') return 0;
  if (key === 'End') return length - 1;
  return Math.max(0, Math.min(length - 1, index + (next ? 1 : -1)));
}
