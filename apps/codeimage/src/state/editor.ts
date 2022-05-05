import {createStore, select, withProps} from '@ngneat/elf';
import {localStorageStrategy, persistState} from '@ngneat/elf-persist-state';
import {distinctUntilChanged, map} from 'rxjs';
import {appEnvironment} from '../core/configuration';
import {SUPPORTED_FONTS} from '../core/configuration/font';
import shallow from '../core/helpers/shallow';
import {elfAutoSettersFactory} from '../core/store/elf-auto-setters-factory';

interface EditorState {
  languageId: string;
  themeId: string;
  code: string;
  fontId: string;
  fontWeight: number;
  showLineNumbers: boolean;
  focused: boolean;
}

const initialState: EditorState = {
  code: appEnvironment.defaultState.editor.code,
  languageId: appEnvironment.defaultState.editor.languageId,
  themeId: appEnvironment.defaultState.editor.theme.id,
  showLineNumbers: false,
  fontId: appEnvironment.defaultState.editor.font.id,
  fontWeight: appEnvironment.defaultState.editor.font.types[0].weight,
  focused: false,
};

const store = createStore(
  {name: 'editor'},
  withProps<EditorState>(initialState),
);

export const updateEditorStore = store.update.bind(store);

persistState(store, {storage: localStorageStrategy, key: '@store/editor'});

export const {
  setFocused: setFocus,
  setFontId,
  setFontWeight,
  setLanguageId,
  setShowLineNumbers,
  setThemeId: setTheme,
  setCode,
} = elfAutoSettersFactory(store);

export const editor$ = store.pipe(distinctUntilChanged(shallow));

const fontId$ = editor$.pipe(select(store => store.fontId));

export const editorLanguageId$ = editor$.pipe(
  select(store => store.languageId),
);

export const font$ = fontId$.pipe(
  map(id => SUPPORTED_FONTS.find(font => font.id === id)),
);

export const focusedEditor$ = editor$.pipe(select(store => store.focused));
