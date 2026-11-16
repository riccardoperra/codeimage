import type {Accessor} from 'solid-js';
import {createContext, useContext} from 'solid-js';

export const EditorPopupHost = createContext<Accessor<HTMLElement | undefined>>(
  () => undefined,
);

export const useEditorPopupHost = () => useContext(EditorPopupHost);
