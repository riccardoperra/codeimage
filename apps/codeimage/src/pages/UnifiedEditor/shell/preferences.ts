import {getWhatsNew} from '../../../state/whats-new';
import {createSignal} from 'solid-js';
import {setThemeStyle, themeStyle} from '../theme-styles/style';

/** The layouts a user can choose. */
export const LAYOUTS = [
  {
    id: 'sidebar',
    name: 'editor.sidebar',
    hint: 'editor.sidebarHint',
  },
  {
    id: 'dock',
    name: 'editor.dock',
    hint: 'editor.dockHint',
  },
] as const;

export type LayoutId = (typeof LAYOUTS)[number]['id'];

/** How the sidebar moves between its sections. */
export const PANEL_NAVS = [
  {
    id: 'accordion',
    name: 'editor.navAccordion',
    hint: 'editor.navAccordionHint',
  },
  {id: 'rail', name: 'editor.navRail', hint: 'editor.navRailHint'},
] as const;

export type PanelNav = (typeof PANEL_NAVS)[number]['id'];
export type PanelSide = 'left' | 'right';

/** The theme card styles a user can choose, by their id in `theme-styles/`. */
export const THEME_CARDS = [
  {id: 'window', name: 'frame.terminal', hint: 'editor.windowHint'},
  {id: 'orb', name: 'editor.orb', hint: 'editor.orbHint'},
  {id: 'aa', name: 'editor.aa', hint: 'editor.aaHint'},
] as const;

export type ThemeCardsId = (typeof THEME_CARDS)[number]['id'];

/** The colour modes of the app, each drawn as an orb in the settings. */
export const COLOUR_MODES = [
  {id: 'dark', name: 'editor.dark', hint: 'editor.darkHint'},
  {id: 'light', name: 'editor.light', hint: 'editor.lightHint'},
  {id: 'system', name: 'editor.system', hint: 'editor.systemHint'},
] as const;

export type ColourModeId = (typeof COLOUR_MODES)[number]['id'];

/** How Export offers a one-off format and scale: a menu under the button, or a dialog. */
export const EXPORT_STYLES = [
  {id: 'panel', name: 'editor.exportStylePanel'},
  {id: 'sheet', name: 'editor.exportStyleSheet'},
] as const;

export type ExportStyleId = (typeof EXPORT_STYLES)[number]['id'];

/** How local AI gets tool calls from the model. */
export const LOCAL_AI_PROVIDERS = [
  {id: 'auto', name: 'localAi.providerAuto'},
  {id: 'native', name: 'localAi.providerNative'},
  {id: 'structured', name: 'localAi.providerStructured'},
] as const;

export type LocalAiProviderId = (typeof LOCAL_AI_PROVIDERS)[number]['id'];

interface Stored {
  layout?: LayoutId;
  panelNav?: PanelNav;
  panelSide?: PanelSide;
  themeCards?: ThemeCardsId;
  exportStyle?: ExportStyleId;
  localAi?: boolean;
  localAiProvider?: LocalAiProviderId;
}

const STORAGE_KEY = 'codeimage:editor-settings';
/** What the editor shows before any choice. The other layouts and cards are experiments. */
export const DEFAULT_LAYOUT: LayoutId = 'sidebar';
const DEFAULT_NAV: PanelNav = 'accordion';
const DEFAULT_SIDE: PanelSide = 'right';
export const DEFAULT_CARDS: ThemeCardsId = 'window';
const DEFAULT_EXPORT_STYLE: ExportStyleId = 'panel';

const isLayout = (value: unknown): value is LayoutId =>
  LAYOUTS.some(layout => layout.id === value);
const isNav = (value: unknown): value is PanelNav =>
  PANEL_NAVS.some(nav => nav.id === value);
const isSide = (value: unknown): value is PanelSide =>
  value === 'left' || value === 'right';
const isCards = (value: unknown): value is ThemeCardsId =>
  THEME_CARDS.some(cards => cards.id === value);
const isExportStyle = (value: unknown): value is ExportStyleId =>
  EXPORT_STYLES.some(style => style.id === value);
const isLocalAiProvider = (value: unknown): value is LocalAiProviderId =>
  LOCAL_AI_PROVIDERS.some(provider => provider.id === value);

// Storage is outside the program: read it as unknown and keep what is valid.
function readStored(): Stored {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (typeof raw !== 'object' || raw === null) return {};
    const {
      layout,
      panelNav,
      panelSide,
      inspectorSide,
      themeCards,
      exportStyle,
      localAi,
      localAiProvider,
    } = raw as Record<string, unknown>;
    const others = {
      themeCards: isCards(themeCards) ? themeCards : undefined,
      exportStyle: isExportStyle(exportStyle) ? exportStyle : undefined,
      localAi: typeof localAi === 'boolean' ? localAi : undefined,
      localAiProvider: isLocalAiProvider(localAiProvider)
        ? localAiProvider
        : undefined,
    };
    // Inspector and Studio were two layouts, saved before the sidebar had a
    // navigation. Such a record keeps its look: Inspector is the accordion on
    // its saved side, Studio the rail on the left.
    if (layout === 'inspector' || layout === 'studio') {
      return {
        ...others,
        layout: 'sidebar',
        panelNav: layout === 'inspector' ? 'accordion' : 'rail',
        panelSide:
          layout === 'studio'
            ? 'left'
            : isSide(inspectorSide)
              ? inspectorSide
              : undefined,
      };
    }
    return {
      ...others,
      layout: isLayout(layout) ? layout : undefined,
      panelNav: isNav(panelNav) ? panelNav : undefined,
      panelSide: isSide(panelSide) ? panelSide : undefined,
    };
  } catch {
    return {};
  }
}

const stored = readStored();

const [layout, setLayoutId] = createSignal<LayoutId>(
  stored.layout ?? DEFAULT_LAYOUT,
);
const [panelNav, setNav] = createSignal<PanelNav>(
  stored.panelNav ?? DEFAULT_NAV,
);
const [panelSide, setSide] = createSignal<PanelSide>(
  stored.panelSide ?? DEFAULT_SIDE,
);

const [exportStyle, setExportStyleId] = createSignal<ExportStyleId>(
  stored.exportStyle ?? DEFAULT_EXPORT_STYLE,
);

const [localAi, setLocalAiOn] = createSignal(stored.localAi ?? false);
const [localAiProvider, setProvider] = createSignal<LocalAiProviderId>(
  stored.localAiProvider ?? 'auto',
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
  /** The sidebar's navigation, accordion or rail. */
  panelNav,
  setPanelNav: (nav: PanelNav) => {
    setNav(nav);
    save({panelNav: nav});
  },
  panelSide,
  setPanelSide: (side: PanelSide) => {
    setSide(side);
    save({panelSide: side});
  },
  exportStyle,
  setExportStyle: (id: ExportStyleId) => {
    setExportStyleId(id);
    save({exportStyle: id});
  },
  /** The theme card style in use. */
  themeCards: themeStyle,
  setThemeCards: (id: ThemeCardsId) => {
    getWhatsNew().seen('theme-cards');
    setThemeStyle(id);
    save({themeCards: id});
  },
  /** Whether the command menu offers the on-device model, an experiment. */
  localAi,
  setLocalAi: (on: boolean) => {
    setLocalAiOn(on);
    save({localAi: on});
  },
  localAiProvider,
  setLocalAiProvider: (id: LocalAiProviderId) => {
    setProvider(id);
    save({localAiProvider: id});
  },
  /** True while a layout, a theme card style or local AI that is not the default is on. */
  experimenting: () =>
    layout() !== DEFAULT_LAYOUT ||
    themeStyle() !== DEFAULT_CARDS ||
    localAi() ||
    localAiProvider() !== 'auto',
  /** Turns every experiment off: back to the default layout and theme cards, without local AI. */
  restoreDefaults: () => {
    preferences.setLayout(DEFAULT_LAYOUT);
    preferences.setThemeCards(DEFAULT_CARDS);
    preferences.setLocalAi(false);
    preferences.setLocalAiProvider('auto');
  },
};
