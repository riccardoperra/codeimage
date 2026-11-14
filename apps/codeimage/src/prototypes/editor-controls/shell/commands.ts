import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getUiStore} from '@codeimage/store/ui';
import {ExportExtension} from '../../../hooks/use-export-image';
import type {Command} from '../command-menu/commands';
import type {Exporter} from './export';
import {exportSummary} from './ExportControl';
import {LAYOUTS, preferences, THEME_CARDS} from './preferences';
import {SECTIONS, settings} from './settings-state';

const GROUP = 'Settings';

const MODES = [
  {id: 'dark', name: 'Dark'},
  {id: 'light', name: 'Light'},
  {id: 'system', name: 'System'},
] as const;

/**
 * Export and every export setting as commands. They read and write the
 * production export store, as the Export section of the settings does.
 */
export function exportCommands(exporter: Exporter): Command[] {
  const store = getExportCanvasStore();
  const group = 'Export';
  const tabs = exporter.tabs();
  const formats = [
    {id: ExportExtension.png, name: 'PNG'},
    {id: ExportExtension.svg, name: 'SVG'},
    {id: ExportExtension.jpeg, name: 'JPEG'},
  ];
  return [
    {
      id: 'export=image',
      group,
      label: 'Export image',
      note: exportSummary(),
      run: exporter.image,
    },
    ...(tabs > 1
      ? [
          {
            id: 'export=each-tab',
            group,
            label: 'Export one image per tab',
            note: `${tabs} images`,
            run: exporter.eachTab,
          },
        ]
      : []),
    {
      id: 'export=settings',
      group,
      label: 'Export settings…',
      run: () => settings.open('export'),
    },
    ...formats.map((format): Command => ({
      id: `export-format=${format.id}`,
      group,
      label: `Export format: ${format.name}`,
      current: format.id === store.get.extension,
      run: () => store.set('extension', format.id),
    })),
    ...[1, 2, 3, 6].map((scale): Command => ({
      id: `export-scale=${scale}`,
      group,
      label: `Export scale: ${scale}x`,
      current: scale === store.get.devicePixelRatio,
      run: () => store.set('devicePixelRatio', scale),
    })),
    ...[70, 80, 90, 100].map((quality): Command => ({
      id: `export-quality=${quality}`,
      group,
      label: `JPEG quality: ${quality}%`,
      current: quality === store.get.jpegQuality,
      run: () => store.set('jpegQuality', quality),
    })),
    ...[
      {on: true, name: 'Only the active tab'},
      {on: false, name: 'All tabs'},
    ].map((choice): Command => ({
      id: `export-tabs=${choice.on}`,
      group,
      label: `Export tabs: ${choice.name}`,
      current: choice.on === store.get.showOnlyActiveTab,
      run: () => store.setShowOnlyActiveTab(choice.on),
    })),
  ];
}

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
    ...SECTIONS.map((section): Command => ({
      id: `settings=${section.id}`,
      group: GROUP,
      label: `Settings: ${section.name}`,
      run: () => settings.open(section.id),
    })),
    ...LAYOUTS.map((entry): Command => ({
      id: `layout=${entry.id}`,
      group: GROUP,
      label: `Layout: ${entry.name}`,
      current: entry.id === layout,
      run: () => preferences.setLayout(entry.id),
    })),
    ...(layout === 'inspector'
      ? sides.map((side): Command => ({
          id: `inspector-side=${side.id}`,
          group: GROUP,
          label: `Inspector side: ${side.name}`,
          current: side.id === preferences.inspectorSide(),
          run: () => preferences.setInspectorSide(side.id),
        }))
      : []),
    ...THEME_CARDS.map((cards): Command => ({
      id: `theme-cards=${cards.id}`,
      group: GROUP,
      label: `Theme cards: ${cards.name}`,
      current: cards.id === preferences.themeCards(),
      run: () => preferences.setThemeCards(cards.id),
    })),
    ...MODES.map((mode): Command => ({
      id: `colour-mode=${mode.id}`,
      group: GROUP,
      label: `Colour mode: ${mode.name}`,
      current: mode.id === ui.get.themeMode,
      run: () => ui.setThemeMode(mode.id),
    })),
    ...extra,
  ];
}
