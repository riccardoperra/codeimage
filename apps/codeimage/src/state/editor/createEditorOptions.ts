import {createRoot} from 'solid-js';
import {createStore} from 'solid-js/store';
import {appEnvironment} from '../../core/configuration';

export interface EditorUIOptions {
  readonly fontId: string;
  readonly fontWeight: number;
  readonly showLineNumbers: boolean;
  readonly focused: boolean;
  readonly themeId: string;
}

function $createEditorOptions() {
  const [state, setState] = createStore<EditorUIOptions>({
    themeId: appEnvironment.defaultState.editor.theme.id,
    showLineNumbers: false,
    fontId: appEnvironment.defaultState.editor.font.id,
    fontWeight: appEnvironment.defaultState.editor.font.types[0].weight,
    focused: false,
  });

  return [
    state,
    setState,
    {
      setFocused(focused: boolean) {
        setState('focused', focused);
      },
      setFontId(fontId: string) {
        setState('fontId', fontId);
      },
      setThemeId(themeId: string) {
        setState('themeId', themeId);
      },
      setFontWeight(fontWeight: number) {
        setState('fontWeight', fontWeight);
      },
      setShowLineNumbers(show: boolean) {
        setState('showLineNumbers', show);
      },
    },
  ] as const;
}

const createEditorOptions = createRoot($createEditorOptions);

export function getRootEditorOptions() {
  return createEditorOptions;
}
