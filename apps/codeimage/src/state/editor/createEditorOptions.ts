import {appEnvironment} from '@core/configuration';
import makeStore from '@core/store/makeStore';
import {createRoot} from 'solid-js';

export interface EditorUIOptions {
  readonly fontId: string;
  readonly fontWeight: number;
  readonly showLineNumbers: boolean;
  readonly focused: boolean;
  readonly themeId: string;
}

export function getInitialEditorUiOptions(): EditorUIOptions {
  return {
    themeId: 'vsCodeDarkTheme',
    showLineNumbers: false,
    fontId: appEnvironment.defaultState.editor.font.id,
    fontWeight: appEnvironment.defaultState.editor.font.types[0].weight,
    focused: false,
  };
}

function $createEditorOptions() {
  const [state, setState, {state$}] = makeStore<EditorUIOptions>(
    getInitialEditorUiOptions(),
  );

  return [
    state,
    setState,
    state$,
    {
      setFocused: (focused: boolean) => {
        setState('focused', focused);
      },
      setFontId: (fontId: string) => {
        setState('fontId', fontId);
      },
      setThemeId: (themeId: string) => {
        setState('themeId', themeId);
      },
      setFontWeight: (fontWeight: number) => {
        setState('fontWeight', fontWeight);
      },
      setShowLineNumbers: (show: boolean) => {
        setState('showLineNumbers', show);
      },
    },
  ] as const;
}

const createEditorOptions = createRoot($createEditorOptions);

export function getRootEditorOptions() {
  return createEditorOptions;
}
