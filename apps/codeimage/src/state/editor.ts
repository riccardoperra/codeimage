import {Extension} from '@codemirror/state';
import create from 'solid-zustand';
import {combine, devtools} from 'zustand/middleware';
import {staticConfiguration} from '../core/configuration/static-configuration';

interface EditorState {
  extensions: Extension;
  code: string;
}

// TODO: should be loaded onMount, initial state cannot use this configuration
const initialState: EditorState = {
  code: '',
  extensions: staticConfiguration.themes[0].editorTheme,
};

const store = combine(initialState, set => ({
  setCode: (code: string) => set(() => ({code})),
  setExtensions: (extensions: Extension) => set(() => ({extensions})),
}));

export const useEditorState = create(devtools(store, {name: 'editor'}));
