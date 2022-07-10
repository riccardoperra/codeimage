import {createStoreNotifier} from '@codeimage/store/plugins/store-notifier';
import {appEnvironment} from '@core/configuration';
import {createRoot} from 'solid-js';
import {createStore} from 'solid-js/store';

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
  const [, withNotifier, version] = createStoreNotifier();
  const [state, setState] = createStore<EditorUIOptions>(
    getInitialEditorUiOptions(),
  );

  return [
    state,
    setState,
    {
      version,

      setFocused: withNotifier((focused: boolean) => {
        setState('focused', focused);
      }),
      setFontId: withNotifier((fontId: string) => {
        setState('fontId', fontId);
      }),
      setThemeId: withNotifier((themeId: string) => {
        setState('themeId', themeId);
      }),
      setFontWeight: withNotifier((fontWeight: number) => {
        setState('fontWeight', fontWeight);
      }),
      setShowLineNumbers: withNotifier((show: boolean) => {
        setState('showLineNumbers', show);
      }),
    },
  ] as const;
}

const createEditorOptions = createRoot($createEditorOptions);

export function getRootEditorOptions() {
  return createEditorOptions;
}
