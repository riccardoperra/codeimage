import {Extension} from '@codemirror/state';
import create from 'solid-zustand';
import {combine, devtools} from 'zustand/middleware';
import {THEMES} from '../core/theme';

interface EditorState {
  extensions: Extension;
  code: string;
}

const initialState: EditorState = {
  code: '',
  extensions: THEMES[0].editorTheme,
};

const store = combine(initialState, set => ({
  setCode: (code: string) => set(() => ({code})),
  setExtensions: (extensions: Extension) => set(() => ({extensions})),
}));

export const useEditorState = create(devtools(store, {name: 'editor'}));
