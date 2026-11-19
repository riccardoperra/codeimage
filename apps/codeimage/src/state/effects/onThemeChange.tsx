import {AVAILABLE_COLORS, AVAILABLE_GRADIENTS} from '@codeimage/config';
import type {CustomTheme} from '@codeimage/highlight';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {getUmami} from '@core/constants/umami';

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

  const apply = (resolved: CustomTheme | undefined) => {
    if (!resolved) return;
    if (updateBackground)
      frame.setBackground(resolved.properties.previewBackground);
    terminal.setState(draft => {
      draft.background = resolved.properties.terminal.main;
      draft.textColor = resolved.properties.terminal.text;
    });
    editor.actions.setThemeId(resolved.id);
    getUmami().track('theme-change', {theme: resolved.id});
  };

  if (typeof theme === 'string') void getThemeDef(theme)?.load().then(apply);
  else apply(theme);
}

const randomizeBoolean = () => Math.random() < 0.5;

const randomizeElement = <T,>(array: readonly T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export function dispatchRandomTheme() {
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

  terminal.setState(draft => {
    draft.accentVisible = randomizeBoolean();
    draft.alternativeTheme = randomizeBoolean();
    draft.showGlassReflection = randomizeBoolean();
    draft.shadow = randomizeElement(Object.values(TERMINAL_SHADOWS));
    draft.type = randomizeElement(AVAILABLE_TERMINAL_THEMES.keys);
  });
}
