import type {LocaleKeys} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {getUiStore} from '@codeimage/store/ui';
import {
  markCommands,
  shortcutKeys,
} from '../../../components/CustomEditor/plugins/lineMarks/controls';
import {useHotkey} from '../../../hooks/use-hotkey';
import type {AppLocaleEntries} from '../../../i18n';

type Shortcut = {label: LocaleKeys<AppLocaleEntries>; key: string[]};
// KeyboardShortcuts keeps its definitions private. Mirror its list here, using
// the production mark definitions, until it exposes a list and hotkey hook.
export const shortcuts: readonly Shortcut[] = [
  {label: 'animation.shortcut.togglePlayback', key: ['Space']},
  {label: 'animation.shortcut.backToEditor', key: ['Esc']},
  {label: 'shortcut.focusCodeEditor', key: ['F']},
  {label: 'shortcut.unFocusCodeEditor', key: ['Esc']},
  {label: 'shortcut.toggleBackground', key: ['B']},
  {label: 'shortcut.toggleDarkMode', key: ['D']},
  {label: 'shortcut.toggleHeader', key: ['H']},
  {label: 'shortcut.changePadding', key: ['P']},
  {label: 'shortcut.export', key: ['Ctrl', 'S']},
  {label: 'shortcut.exportNewTab', key: ['Ctrl', 'O']},
  {label: 'shortcut.copyLink', key: ['Ctrl', 'Shift', 'C']},
  {label: 'shortcut.copySnippet', key: ['Ctrl', 'C']},
  {label: 'shortcut.openShortcuts', key: ['?']},
  ...markCommands.map(command => ({
    label:
      `lineMarks.shortcut.${command.id}` satisfies LocaleKeys<AppLocaleEntries>,
    key: shortcutKeys(command.key),
  })),
];

export function bindEditorShortcuts() {
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
    if (!inField()) action();
  };
  useHotkey(document.body, {
    F: event => {
      if (!inField()) {
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
