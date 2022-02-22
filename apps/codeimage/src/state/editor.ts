import {Extension} from '@codemirror/state';
import create from 'solid-zustand';
import {combine, devtools} from 'zustand/middleware';
import {staticConfiguration} from '../core/configuration/static-configuration';

interface EditorState {
  languageId: string;
  extensions: Extension;
  code: string;
}

// TODO: should be loaded onMount, initial state cannot use this configuration
const initialState: EditorState = {
  code: '',
  languageId: staticConfiguration.languages[0].id,
  extensions: staticConfiguration.themes[0].editorTheme,
};

const store = combine(initialState, set => ({
  setLanguageId: (languageId: string) => set(() => ({languageId})),
  setCode: (code: string) => set(() => ({code})),
  setExtensions: (extensions: Extension) => set(() => ({extensions})),
}));

export const useEditorState = create(devtools(store, {name: 'editor'}));
