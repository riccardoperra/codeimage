import create from 'solid-zustand';
import {combine, devtools, persist} from 'zustand/middleware';
import {staticConfiguration} from '../core/configuration';
import {query} from './middleware';

export interface FrameStateSlice {
  background: string | null | undefined;
  padding: number;
  radius: number;
  visible: boolean;
  opacity: number;
  autoWidth: boolean;
  scale: number;
}

const initialState: FrameStateSlice = {
  background: staticConfiguration.themes[0].properties.previewBackground,
  padding: 128,
  radius: 24,
  visible: true,
  opacity: 100,
  autoWidth: false,
  scale: 1,
};

const store = combine(initialState, set => ({
  setPadding: (padding: number) => set(() => ({padding})),
  setRadius: (radius: number) => set(() => ({radius})),
  setOpacity: (opacity: number) => set(() => ({opacity})),
  setVisibility: (visible: boolean) => set(() => ({visible})),
  setAutoWidth: (autoWidth: boolean) => set(() => ({autoWidth})),
  setBackground: (background: string | null) => set(() => ({background})),
  setScale: (scale: number) => set(() => ({scale})),
  toggleVisibility: () => set(({visible}) => ({visible: !visible})),
}));

export const useFrameState = create(
  devtools(
    persist(query(store, {debounce: 500, prefix: 'frame'}), {
      name: '@store/frame',
    }),
    {
      name: 'frame',
    },
  ),
);
