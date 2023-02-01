import {AVAILABLE_COLORS, AVAILABLE_GRADIENTS} from '@codeimage/config';
import {CustomTheme} from '@codeimage/highlight';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {pipe, tap} from 'rxjs';
import {batch} from 'solid-js';
import {effect} from '@codeimage/atomic-state';

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

const randomizeBoolean = () => Math.random() < 0.5;

const randomizeElement = <T,>(array: readonly T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const dispatchRandomTheme = effect<void>(
  pipe(
    tap(() => {
      const {themeArray: themes} = getThemeStore();
      const index = Math.floor(Math.random() * themes().length);
      const theme = themes()[index]?.();
      const frame = getFrameState();
      const terminal = getTerminalState();

      if (theme) {
        dispatchUpdateTheme({theme});
      }

      frame.setBackground(
        randomizeElement([...AVAILABLE_GRADIENTS, ...AVAILABLE_COLORS]),
      );

      terminal.setState('accentVisible', randomizeBoolean());
      terminal.setState('alternativeTheme', randomizeBoolean());
      terminal.setState('showGlassReflection', randomizeBoolean());
      terminal.setState(
        'shadow',
        randomizeElement(Object.values(TERMINAL_SHADOWS)),
      );
      terminal.setState(
        'type',
        randomizeElement(AVAILABLE_TERMINAL_THEMES.keys),
      );
    }),
  ),
);
