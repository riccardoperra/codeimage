import {getWhatsNew} from '../../../state/whats-new';
import {getUiStore} from '@codeimage/store/ui';
import type {Command} from '../command-menu/commands';
import {LAYOUTS, preferences, THEME_CARDS} from './preferences';
import {SECTIONS, settings} from './settings-state';

const GROUP = 'Settings';

const MODES = [
  {id: 'dark', name: 'Dark'},
  {id: 'light', name: 'Light'},
  {id: 'system', name: 'System'},
] as const;

/**
 * The settings as commands, so that the layout, the Inspector's side, the
 * theme cards and the colour mode can change from the command menu. `extra`
 * are the entries of the old menu at the top left that need the page to run.
 */
export function settingsCommands(extra: readonly Command[]): Command[] {
  const ui = getUiStore();
  const layout = preferences.layout();
  const sides = [
    {id: 'left', name: 'Left'},
    {id: 'right', name: 'Right'},
  ] as const;

  return [
    {
      id: 'settings',
      group: GROUP,
      label: 'Settings…',
      run: () => settings.open(),
    },
    // A link to each section of the dialog.
    ...SECTIONS.map(
      (section): Command => ({
        id: `settings=${section.id}`,
        group: GROUP,
        label: `Settings: ${section.name}`,
        run: () => settings.open(section.id),
      }),
    ),
    ...LAYOUTS.map(
      (entry): Command => ({
        id: `layout=${entry.id}`,
        group: GROUP,
        label: `Layout: ${entry.name}`,
        current: entry.id === layout,
        run: () => {
          preferences.setLayout(entry.id);
          getWhatsNew().seen('layouts');
        },
      }),
    ),
    ...(layout === 'inspector'
      ? sides.map(
          (side): Command => ({
            id: `inspector-side=${side.id}`,
            group: GROUP,
            label: `Inspector side: ${side.name}`,
            current: side.id === preferences.inspectorSide(),
            run: () => preferences.setInspectorSide(side.id),
          }),
        )
      : []),
    ...THEME_CARDS.map(
      (cards): Command => ({
        id: `theme-cards=${cards.id}`,
        group: GROUP,
        label: `Theme cards: ${cards.name}`,
        current: cards.id === preferences.themeCards(),
        run: () => {
          preferences.setThemeCards(cards.id);
          getWhatsNew().seen('theme-cards');
        },
      }),
    ),
    ...MODES.map(
      (mode): Command => ({
        id: `colour-mode=${mode.id}`,
        group: GROUP,
        label: `Colour mode: ${mode.name}`,
        current: mode.id === ui.get.themeMode,
        run: () => ui.setThemeMode(mode.id),
      }),
    ),
    ...extra,
  ];
}
