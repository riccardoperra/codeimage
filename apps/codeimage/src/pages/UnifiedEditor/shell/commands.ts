import {useI18n} from '@codeimage/locale';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getUiStore} from '@codeimage/store/ui';
import type {AppLocaleEntries} from '../../../i18n';
import type {Command} from '../command-menu/commands';
import type {Exporter} from './export';
import {EXPORT_SCALES, exportFormats, exportSummary} from './export-formats';
import {COLOUR_MODES, LAYOUTS, preferences, THEME_CARDS} from './preferences';
import {SECTIONS, settings} from './settings-state';

/**
 * Export and every export setting as commands. They read and write the
 * production export store, as the Export section of the settings does.
 */
export function exportCommands(exporter: Exporter): Command[] {
  const [t] = useI18n<AppLocaleEntries>();
  const store = getExportCanvasStore();
  const group = t('toolbar.export');
  const tabs = exporter.tabs();
  return [
    {
      id: 'export=image',
      group,
      label: t('export.title'),
      note: exportSummary(),
      run: () => exporter.image(),
    },
    ...(tabs > 1
      ? [
          {
            id: 'export=each-tab',
            group,
            label: t('editor.exportEachTab'),
            note: t('editor.images', {count: String(tabs)}),
            run: () => exporter.eachTab(),
          },
        ]
      : []),
    ...(exporter.canCopyAltText()
      ? [
          {
            id: 'export=alt-text',
            group,
            label: t('altText.copy'),
            run: exporter.copyAltText,
          },
        ]
      : []),
    ...(exporter.canCopy()
      ? [
          {
            id: 'export=copy',
            group,
            label: t('toolbar.copyToCliboard'),
            run: () => exporter.copy(),
          },
        ]
      : []),
    {
      id: 'export=new-tab',
      group,
      label: t('editor.openImageTab'),
      run: () => exporter.newTab(),
    },
    ...(exporter.canShare()
      ? [
          {
            id: 'export=share',
            group,
            label: t('export.shareMode'),
            run: () => exporter.share(),
          },
        ]
      : []),
    ...exportFormats.map((format): Command => ({
      id: `export-format=${format.extension}`,
      group,
      label: t('editor.exportFormat', {value: format.name}),
      current: format.extension === store.get.extension,
      run: () => store.set('extension', format.extension),
    })),
    ...(getFrameState().exportTarget() ? [] : EXPORT_SCALES).map(
      (scale): Command => ({
        id: `export-scale=${scale}`,
        group,
        label: t('editor.exportScale', {value: `${scale}x`}),
        current: scale === store.get.devicePixelRatio,
        run: () => store.set('devicePixelRatio', scale),
      }),
    ),
    ...[70, 80, 90, 100].map((quality): Command => ({
      id: `export-quality=${quality}`,
      group,
      label: t('editor.jpegQuality', {value: `${quality}%`}),
      current: quality === store.get.jpegQuality,
      run: () => store.set('jpegQuality', quality),
    })),
    ...[
      {on: true, name: t('exportTabs.showOnlyActiveTab')},
      {on: false, name: t('editor.allTabs')},
    ].map((choice): Command => ({
      id: `export-tabs=${choice.on}`,
      group,
      label: t('editor.exportTabs', {value: choice.name}),
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
  const [t] = useI18n<AppLocaleEntries>();
  const ui = getUiStore();
  const layout = preferences.layout();
  const sides = [
    {id: 'left', name: t('signature.left')},
    {id: 'right', name: t('signature.right')},
  ] as const;

  return [
    {
      id: 'settings',
      group: t('editor.settings'),
      label: t('editor.settingsCommand'),
      run: () => settings.open(),
    },
    // A link to each section of the dialog.
    ...SECTIONS.map((section): Command => ({
      id: `settings=${section.id}`,
      group: t('editor.settings'),
      label:
        section.id === 'experiments'
          ? t('editor.openExperiments')
          : t('editor.settingSection', {value: t(section.name)}),
      run: () => settings.open(section.id),
    })),
    ...LAYOUTS.map((entry): Command => ({
      id: `layout=${entry.id}`,
      group: t('editor.settings'),
      label: t('editor.layoutCommand', {value: t(entry.name)}),
      current: entry.id === layout,
      run: () => preferences.setLayout(entry.id),
    })),
    ...(layout === 'inspector'
      ? sides.map((side): Command => ({
          id: `inspector-side=${side.id}`,
          group: t('editor.settings'),
          label: t('editor.sideCommand', {value: side.name}),
          current: side.id === preferences.inspectorSide(),
          run: () => preferences.setInspectorSide(side.id),
        }))
      : []),
    ...THEME_CARDS.map((cards): Command => ({
      id: `theme-cards=${cards.id}`,
      group: t('editor.settings'),
      label: t('editor.cardsCommand', {value: t(cards.name)}),
      current: cards.id === preferences.themeCards(),
      run: () => preferences.setThemeCards(cards.id),
    })),
    ...COLOUR_MODES.map((mode): Command => ({
      id: `colour-mode=${mode.id}`,
      group: t('editor.settings'),
      label: t('editor.modeCommand', {value: t(mode.name)}),
      current: mode.id === ui.get.themeMode,
      run: () => ui.setThemeMode(mode.id),
    })),
    ...extra,
  ];
}
