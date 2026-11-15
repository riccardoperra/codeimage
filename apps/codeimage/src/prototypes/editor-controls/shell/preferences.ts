import {getWhatsNew} from '../../../state/whats-new';
import {createSignal} from 'solid-js';
import {setThemeStyle, THEME_STYLES, themeStyle} from '../theme-styles/style';

/** The layouts a user can choose. `param` is the value of the `v` URL parameter. */
export const LAYOUTS = [
  {
    id: 'inspector',
    name: 'editor.inspector',
    hint: 'editor.inspectorHint',
    param: '2',
  },
  {
    id: 'dock',
    name: 'editor.dock',
    hint: 'editor.dockHint',
    param: '3',
  },
  {
    id: 'studio',
    name: 'editor.studio',
    hint: 'editor.studioHint',
    param: '4',
  },
] as const;

export type LayoutId = (typeof LAYOUTS)[number]['id'];
export type InspectorSide = 'left' | 'right';

/** The theme card styles a user can choose, by their id in `theme-styles/`. */
export const THEME_CARDS = [
  {id: 'window', name: 'frame.terminal', hint: 'editor.windowHint'},
  {id: 'orb', name: 'editor.orb', hint: 'editor.orbHint'},
  {id: 'aa', name: 'editor.aa', hint: 'editor.aaHint'},
] as const;

export type ThemeCardsId = (typeof THEME_CARDS)[number]['id'];

interface Stored {
  layout?: LayoutId;
  inspectorSide?: InspectorSide;
  themeCards?: ThemeCardsId;
}

const STORAGE_KEY = 'codeimage:prototype-settings';
/** What the editor shows before any choice. The other layouts and cards are experiments. */
export const DEFAULT_LAYOUT: LayoutId = 'inspector';
const DEFAULT_SIDE: InspectorSide = 'right';
export const DEFAULT_CARDS: ThemeCardsId = 'window';

const isLayout = (value: unknown): value is LayoutId =>
  LAYOUTS.some(layout => layout.id === value);
const isCards = (value: unknown): value is ThemeCardsId =>
  THEME_CARDS.some(cards => cards.id === value);

// Storage is outside the program: read it as unknown and keep what is valid.
function readStored(): Stored {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (typeof raw !== 'object' || raw === null) return {};
    const {layout, inspectorSide, themeCards} = raw as Record<string, unknown>;
    return {
      layout: isLayout(layout) ? layout : undefined,
      inspectorSide:
        inspectorSide === 'left' || inspectorSide === 'right'
          ? inspectorSide
          : undefined,
      themeCards: isCards(themeCards) ? themeCards : undefined,
    };
  } catch {
    return {};
  }
}

const params = () => new URLSearchParams(location.search);

/** Writes a URL parameter only where the link already carries it, so `/` stays clean. */
function syncParam(name: string, value: string) {
  const url = new URL(location.href);
  if (!url.searchParams.has(name)) return;
  url.searchParams.set(name, value);
  history.replaceState(history.state, '', url);
}

/**
 * `setThemeStyle` always writes the `t` parameter. Where the link had none,
 * it is taken out again, so that a stored choice does not rewrite the URL.
 */
function showThemeCards(id: ThemeCardsId) {
  const url = new URL(location.href);
  const linked = url.searchParams.has('t');
  setThemeStyle(id);
  if (!linked) history.replaceState(history.state, '', url);
}

const stored = readStored();
const linkedLayout = LAYOUTS.find(layout => layout.param === params().get('v'));

const [layout, setLayoutId] = createSignal<LayoutId>(
  linkedLayout?.id ?? stored.layout ?? DEFAULT_LAYOUT,
);
const [inspectorSide, setSide] = createSignal<InspectorSide>(
  stored.inspectorSide ?? DEFAULT_SIDE,
);

// A `t` in the link wins and is already what `themeStyle()` holds.
if (!params().has('t')) {
  const cards = stored.themeCards ?? DEFAULT_CARDS;
  if (
    cards !== themeStyle() &&
    THEME_STYLES.some(style => style.id === cards)
  ) {
    showThemeCards(cards);
  }
}

function save(change: Stored) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({...readStored(), ...change}),
    );
  } catch {
    // Private windows can refuse storage. The choice then lasts for the page.
  }
}

/**
 * What a user chooses about the editor's own interface, kept in local storage
 * under one key. The `v` and `t` URL parameters win when a link carries them,
 * and a choice made here updates the ones the link carries.
 */
export const preferences = {
  layout,
  setLayout: (id: LayoutId) => {
    getWhatsNew().seen('layouts');
    setLayoutId(id);
    save({layout: id});
    syncParam('v', LAYOUTS.find(entry => entry.id === id)?.param ?? '');
  },
  inspectorSide,
  setInspectorSide: (side: InspectorSide) => {
    setSide(side);
    save({inspectorSide: side});
  },
  /** The theme card style in use, which a link can set to one outside `THEME_CARDS`. */
  themeCards: themeStyle,
  setThemeCards: (id: ThemeCardsId) => {
    getWhatsNew().seen('theme-cards');
    showThemeCards(id);
    save({themeCards: id});
  },
  /** True while a layout or a theme card style that is not the default is on. */
  experimenting: () =>
    layout() !== DEFAULT_LAYOUT || themeStyle() !== DEFAULT_CARDS,
  /** Turns every experiment off: back to the default layout and theme cards. */
  restoreDefaults: () => {
    preferences.setLayout(DEFAULT_LAYOUT);
    preferences.setThemeCards(DEFAULT_CARDS);
  },
};
