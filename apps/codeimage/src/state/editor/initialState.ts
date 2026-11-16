import {createUniqueId} from '@codeimage/store/plugins/unique-id';
import {appEnvironment} from '@core/configuration';
import type {EditorState, EditorUIOptions} from './model';

export const defaultId = createUniqueId();

export function getInitialEditorState(): EditorState {
  return {
    id: defaultId,
    code: appEnvironment.defaultState.editor.code,
    languageId: appEnvironment.defaultState.editor.languageId,
    formatter: null,
    lineNumberStart: 1,
    marks: {lines: [], focusedLines: []},
    tab: {
      tabName: 'index.tsx',
      tabIcon: undefined,
    },
  };
}

export function getInitialEditorUiOptions(): EditorUIOptions {
  return {
    themeId: 'fleetTheme',
    showLineNumbers: false,
    fontId: appEnvironment.defaultState.editor.font.id,
    fontWeight: appEnvironment.defaultState.editor.font.types[0].weight,
    focused: false,
    enableLigatures: true,
  };
}
