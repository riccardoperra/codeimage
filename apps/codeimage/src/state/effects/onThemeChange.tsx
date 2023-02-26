import {effect} from '@codeimage/atomic-state';
import {AVAILABLE_COLORS, AVAILABLE_GRADIENTS} from '@codeimage/config';
import {CustomTheme} from '@codeimage/highlight';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {getUmami} from '@core/constants/umami';
import {pipe, tap} from 'rxjs';
import {batch} from 'solid-js';

export type DispatchUpdateThemeParams = {
  theme: CustomTheme | string;
  updateBackground?: boolean;
};

export function dispatchUpdateTheme(params: DispatchUpdateThemeParams): void {
  const {theme, updateBackground} = params;
  const frame = getFrameState();
  const terminal = getTerminalState();
  const editor = getRootEditorStore();
  const {getThemeDef} = getThemeStore();

  const resolvedTheme = new Promise<CustomTheme | undefined>(r => {
    if (typeof theme === 'string') {
      return getThemeDef(theme)?.load().then(r);
    } else {
      return r(theme);
    }
  });

  resolvedTheme.then(theme => {
    if (theme) {
      batch(() => {
        if (updateBackground) {
          frame.setBackground(theme.properties.previewBackground);
        }
        terminal.setState('background', theme.properties.terminal.main);
        terminal.setState('textColor', theme.properties.terminal.text);
        editor.actions.setThemeId(theme.id);
      });
      getUmami().trackEvent(theme.id, `theme-change`);
    }
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
