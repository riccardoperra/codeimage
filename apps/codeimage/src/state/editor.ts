import create from 'solid-zustand';
import {combine, devtools} from 'zustand/middleware';
import {staticConfiguration} from '../core/configuration';

interface EditorState {
  languageId: string;
  themeId: string;
  code: string;
}

// TODO: should be loaded onMount, initial state cannot use this configuration
const initialState: EditorState = {
  code: '',
  languageId: staticConfiguration.languages[0].id,
  themeId: staticConfiguration.themes[0].id,
};

const store = combine(initialState, set => ({
  setLanguageId: (languageId: string) => set(() => ({languageId})),
  setCode: (code: string) => set(() => ({code})),
  setTheme: (themeId: string) => set(() => ({themeId})),
}));

export const useEditorState = create(devtools(store, {name: 'editor'}));
