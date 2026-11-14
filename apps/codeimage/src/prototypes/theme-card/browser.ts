import type {Accessor, JSX} from 'solid-js';
import {createMemo, createSignal} from 'solid-js';
import type {EditorControlsModel, ThemeEntry} from '../editor-controls/model';

export type ThemeMode = 'all' | 'dark' | 'light';

export interface ThemeGroup {
  readonly label: string;
  readonly themes: readonly ThemeEntry[];
}

export interface ThemeBrowser {
  readonly query: Accessor<string>;
  readonly setQuery: (query: string) => void;
  readonly mode: Accessor<ThemeMode>;
  readonly setMode: (mode: ThemeMode) => void;
  /** The themes that match the search and the mode, in registry order. */
  readonly themes: Accessor<readonly ThemeEntry[]>;
  /** `themes()` split into Dark and Light, without empty groups. */
  readonly groups: Accessor<readonly ThemeGroup[]>;
  /** Spread on the element that holds the theme options. */
  readonly listProps: JSX.HTMLAttributes<HTMLDivElement>;
  /** Spread on each theme's button. */
  readonly optionProps: (
    theme: ThemeEntry,
  ) => JSX.ButtonHTMLAttributes<HTMLButtonElement>;
  /** Moves focus to the first option, e.g. on ArrowDown in the search field. */
  readonly focusFirst: () => void;
}

const OPTION = '[data-theme-option]';

function optionsIn(list: Element): HTMLElement[] {
  return [...list.querySelectorAll<HTMLElement>(OPTION)];
}

// Arrow keys follow the layout on screen, so the same code moves through a
// one-column list and through a grid of cards.
function neighbour(
  options: readonly HTMLElement[],
  from: HTMLElement,
  key: string,
): HTMLElement | undefined {
  const index = options.indexOf(from);
  if (key === 'ArrowRight') return options[index + 1];
  if (key === 'ArrowLeft') return options[index - 1];
  if (key === 'Home') return options[0];
  if (key === 'End') return options[options.length - 1];
  if (key !== 'ArrowDown' && key !== 'ArrowUp') return undefined;
  const origin = from.getBoundingClientRect();
  const centerX = origin.left + origin.width / 2;
  let best: HTMLElement | undefined;
  let bestScore = Infinity;
  for (const option of options) {
    const box = option.getBoundingClientRect();
    const below = box.top >= origin.bottom - 1;
    const above = box.bottom <= origin.top + 1;
    if (key === 'ArrowDown' ? !below : !above) continue;
    const dy =
      key === 'ArrowDown' ? box.top - origin.bottom : origin.top - box.bottom;
    const dx = Math.abs(box.left + box.width / 2 - centerX);
    const score = dy * 10_000 + dx;
    if (score < bestScore) {
      best = option;
      bestScore = score;
    }
  }
  return best;
}

export function createThemeBrowser(model: EditorControlsModel): ThemeBrowser {
  const [query, setQuery] = createSignal('');
  const [mode, setMode] = createSignal<ThemeMode>('all');
  let list: HTMLElement | undefined;

  const themes = createMemo(() => {
    const search = query().trim().toLowerCase();
    return model.themes().filter(theme => {
      if (mode() === 'dark' && !theme.dark) return false;
      if (mode() === 'light' && theme.dark) return false;
      return !search || theme.name.toLowerCase().includes(search);
    });
  });

  const groups = createMemo(() =>
    [
      {label: 'Dark', themes: themes().filter(theme => theme.dark)},
      {label: 'Light', themes: themes().filter(theme => !theme.dark)},
    ].filter(group => group.themes.length > 0),
  );

  const byId = (id: string | undefined) =>
    model.themes().find(theme => theme.id === id);

  const focusedOption = () => {
    const active = document.activeElement;
    return list && active instanceof HTMLElement && list.contains(active)
      ? active.closest<HTMLElement>(OPTION)
      : null;
  };

  // When the pointer leaves, the keyboard focus decides what stays on the
  // canvas: the focused theme, or the applied one when nothing is focused.
  const settle = () => {
    const theme = byId(focusedOption()?.dataset.themeOption);
    if (theme) theme.preview();
    else model.endThemePreview();
  };

  return {
    query,
    setQuery,
    mode,
    setMode,
    themes,
    groups,
    listProps: {
      ref: (el: HTMLDivElement) => (list = el),
      onMouseLeave: settle,
      onFocusOut: event => {
        const next = event.relatedTarget;
        if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
          model.endThemePreview();
        }
      },
      // A native listener: Solid delegates onKeyDown to the document, where
      // stopPropagation would no longer keep the picker from seeing arrows.
      'on:keydown': (event: KeyboardEvent) => {
        const from = focusedOption();
        if (!list || !from) return;
        if (event.key === 'Escape') {
          model.endThemePreview();
          from.blur();
          return;
        }
        const next = neighbour(optionsIn(list), from, event.key);
        if (!next) return;
        event.preventDefault();
        event.stopPropagation();
        next.focus();
      },
    },
    optionProps: theme => ({
      type: 'button',
      'data-theme-option': theme.id,
      get 'aria-pressed'() {
        return theme.active();
      },
      onMouseEnter: () => theme.preview(),
      onFocus: () => theme.preview(),
      onClick: () => theme.apply(),
    }),
    focusFirst: () => {
      if (list) optionsIn(list)[0]?.focus();
    },
  };
}
