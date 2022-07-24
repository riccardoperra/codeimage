import {CustomTheme} from '@codeimage/highlight';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {batch} from 'solid-js';

export type DispatchUpdateThemeParams = {theme: CustomTheme};

export function dispatchUpdateTheme({theme}: DispatchUpdateThemeParams): void {
  const frame = getFrameState();
  const terminal = getTerminalState();
  const editor = getRootEditorStore();
  batch(() => {
    frame.setBackground(theme.properties.previewBackground);
    terminal.setState('background', theme.properties.terminal.main);
    terminal.setState('textColor', theme.properties.terminal.text);
    editor.actions.setThemeId(theme.id);
  });
}
