import create from 'solid-zustand';
import {
  combine,
  devtools,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware';
import {staticConfiguration} from '../core/configuration';
import {query} from './middleware';

interface EditorState {
  languageId: string;
  themeId: string;
  code: string;
  fontId: string;
  fontWeight: number;
  showLineNumbers: boolean;
  focused: boolean;
}

// TODO: should be loaded onMount, initial state cannot use this configuration
const initialState: EditorState = {
  code: '',
  languageId: staticConfiguration.languages[0].id,
  themeId: staticConfiguration.themes[0].id,
  showLineNumbers: false,
  fontId: staticConfiguration.fonts[0].id,
  fontWeight: staticConfiguration.fonts[0].types[0].weight,
  focused: false,
};

const store = combine(initialState, (set, get) => ({
  setLanguageId: (languageId: string) => set(() => ({languageId})),
  setCode: (code: string) => set(() => ({code})),
  setTheme: (themeId: string) => set(() => ({themeId})),
  setShowLineNumbers: (show: boolean) => set(() => ({showLineNumbers: show})),
  setFontId: (fontId: string) => set(() => ({fontId: fontId})),
  setFontWeight: (fontWeight: number) => set(() => ({fontWeight})),
  getFont: () =>
    staticConfiguration.fonts.find(font => font.id === get().fontId),
  setFocus: (focused: boolean) => set(() => ({focused})),
}));

export const useEditorState = create(
  devtools(
    subscribeWithSelector(
      persist(query(store, {debounce: 500, prefix: 'editor'}), {
        name: '@store/editor',
      }),
    ),
    {
      name: 'editor',
    },
  ),
);
