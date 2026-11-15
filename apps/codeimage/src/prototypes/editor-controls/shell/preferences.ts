import {getWhatsNew} from '../../../state/whats-new';
import {createSignal} from 'solid-js';
import {setThemeStyle, themeStyle} from '../theme-styles/style';

/** The layouts a user can choose. */
export const LAYOUTS = [
  {
    id: 'inspector',
    name: 'editor.inspector',
    hint: 'editor.inspectorHint',
  },
  {
    id: 'dock',
    name: 'editor.dock',
    hint: 'editor.dockHint',
  },
  {
    id: 'studio',
    name: 'editor.studio',
    hint: 'editor.studioHint',
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

const stored = readStored();

const [layout, setLayoutId] = createSignal<LayoutId>(
  stored.layout ?? DEFAULT_LAYOUT,
);
const [inspectorSide, setSide] = createSignal<InspectorSide>(
  stored.inspectorSide ?? DEFAULT_SIDE,
);

setThemeStyle(stored.themeCards ?? DEFAULT_CARDS);

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
 * under one key.
 */
export const preferences = {
  layout,
  setLayout: (id: LayoutId) => {
    getWhatsNew().seen('layouts');
    setLayoutId(id);
    save({layout: id});
  },
  inspectorSide,
  setInspectorSide: (side: InspectorSide) => {
    setSide(side);
    save({inspectorSide: side});
  },
  /** The theme card style in use. */
  themeCards: themeStyle,
  setThemeCards: (id: ThemeCardsId) => {
    getWhatsNew().seen('theme-cards');
    setThemeStyle(id);
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
