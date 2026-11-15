import type {Accessor} from 'solid-js';
import type {KeyBindingMap} from 'tinykeys';
import type {LocaleKeys} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {getUiStore} from '@codeimage/store/ui';
import {
  markCommands,
  shortcutKeys,
} from '../../../components/CustomEditor/plugins/lineMarks/controls';
import {isApple} from '../../../core/constants/platform';
import {useHotkey} from '../../../hooks/use-hotkey';
import type {AppLocaleEntries} from '../../../i18n';
import type {Exporter} from '../shell/export';

type ExportShortcut = {
  action: 'image' | 'newTab' | 'copy';
  label: LocaleKeys<AppLocaleEntries>;
  combos: {apple: [string, ...string[]]; other: [string, ...string[]]};
};

export const exportShortcuts = [
  {
    action: 'image',
    label: 'shortcut.export',
    combos: {apple: ['Meta+s', 'Control+s'], other: ['Control+s']},
  },
  {
    action: 'newTab',
    label: 'shortcut.exportNewTab',
    combos: {apple: ['Meta+o', 'Control+o'], other: ['Control+o']},
  },
  {
    action: 'copy',
    label: 'shortcut.copySnippet',
    combos: {apple: ['Meta+Shift+c', 'Control+c'], other: ['Control+c']},
  },
] satisfies ExportShortcut[];

const exportShortcutCombos = (shortcut: ExportShortcut) =>
  shortcut.combos[isApple ? 'apple' : 'other'];

const exportShortcutKeys = (combo: string) =>
  combo.split('+').map(key => {
    if (key === 'Meta') return '⌘';
    if (key === 'Control') return 'Ctrl';
    return key.length === 1 ? key.toUpperCase() : key;
  });

type Shortcut = {label: LocaleKeys<AppLocaleEntries>; key: string[]};
// KeyboardShortcuts keeps its definitions private. Mirror its list here, using
// the production mark definitions, until it exposes a list and hotkey hook.
export const shortcuts: readonly Shortcut[] = [
  {label: 'shortcut.focusCodeEditor', key: ['F']},
  {label: 'shortcut.unFocusCodeEditor', key: ['Esc']},
  {label: 'shortcut.toggleBackground', key: ['B']},
  {label: 'shortcut.toggleDarkMode', key: ['D']},
  {label: 'shortcut.toggleHeader', key: ['H']},
  {label: 'shortcut.changePadding', key: ['P']},
  ...exportShortcuts.map(shortcut => ({
    label: shortcut.label,
    key: exportShortcutKeys(exportShortcutCombos(shortcut)[0]),
  })),
  {label: 'shortcut.openShortcuts', key: ['?']},
  ...markCommands.map(command => ({
    label:
      `lineMarks.shortcut.${command.id}` satisfies LocaleKeys<AppLocaleEntries>,
    key: shortcutKeys(command.key),
  })),
];

export function useExportShortcuts(exporter: Accessor<Exporter>) {
  const onExportShortcut = (
    event: KeyboardEvent,
    shortcut: (typeof exportShortcuts)[number],
    combo: string,
  ) => {
    if (
      combo === 'Control+c' &&
      (getRootEditorStore().state.options.focused ||
        (event.target instanceof Element &&
          event.target.closest('input, textarea, [contenteditable=true]')))
    )
      return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (shortcut.action !== 'copy' || exporter().canCopy())
      exporter()[shortcut.action]();
  };
  const bindings: KeyBindingMap = {};
  for (const shortcut of exportShortcuts) {
    for (const combo of exportShortcutCombos(shortcut)) {
      bindings[combo] = event => onExportShortcut(event, shortcut, combo);
    }
  }
  // Capture before PreviewFrame's production clipboard shortcut on the body.
  useHotkey(window, bindings, {capture: true});
}

export function bindEditorShortcuts(editable: Accessor<boolean>) {
  const editor = getRootEditorStore();
  const frame = getFrameState();
  const terminal = getTerminalState();
  const ui = getUiStore();
  const inField = () =>
    editor.state.options.focused ||
    !!document.activeElement?.closest(
      'input, textarea, [contenteditable=true], [role=dialog], [role=alertdialog]',
    );
  const whenIdle = (action: () => void) => () => {
    if (editable() && !inField()) action();
  };
  useHotkey(document.body, {
    F: event => {
      if (editable() && !inField()) {
        event.preventDefault();
        editor.actions.setFocused(true);
      }
    },
    Escape: () => {
      if (
        editor.state.options.focused &&
        document.activeElement instanceof HTMLElement
      )
        document.activeElement.blur();
    },
    P: whenIdle(() => frame.setNextPadding()),
    B: whenIdle(() => frame.toggleVisibility()),
    D: whenIdle(() => ui.toggleThemeMode()),
    H: whenIdle(() => terminal.toggleShowHeader()),
    W: whenIdle(() => terminal.toggleWatermark()),
  });
}
