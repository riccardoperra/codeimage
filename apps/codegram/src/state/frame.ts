import create from 'solid-zustand';
import {themeVars} from '../theme/global.css';
import {combine, devtools} from 'zustand/middleware';
import {BehaviorSubject} from 'rxjs';

interface FrameState {
  background: string | null | undefined;
  padding: number;
  radius: number;
  visible: boolean;
  opacity: number;
  autoWidth: boolean;
  shadow: string;
}

const initialState: FrameState = {
  background: themeVars.backgroundColor.gray['300'],
  shadow: themeVars.boxShadow.lg,
  padding: 128,
  radius: 24,
  visible: true,
  opacity: 100,
  autoWidth: false,
};

const store = combine(initialState, set => ({
  setPadding: (padding: number) => set(() => ({padding})),
  setRadius: (radius: number) => set(() => ({radius})),
  setOpacity: (opacity: number) => set(() => ({opacity})),
  setVisibility: (visible: boolean) => set(() => ({visible})),
  setAutoWidth: (autoWidth: boolean) => set(() => ({autoWidth})),
  setBackground: (background: string | null) => set(() => ({background})),
  setShadow: (shadow: string) => set(() => ({shadow})),
}));

export const useFrameState = create(devtools(store, {name: 'frame'}));
