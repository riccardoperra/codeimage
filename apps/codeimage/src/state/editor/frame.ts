import {getExportTarget} from '@codeimage/config';
import {createMemo} from 'solid-js';
import {parseSignature} from '@codeimage/store/frame/model';
import type {
  FrameState,
  PersistedFrameState,
} from '@codeimage/store/frame/model';
import {provideAppState} from '@codeimage/store/index';
import type {PresetData} from '@codeimage/store/presets/types';
import {appEnvironment} from '@core/configuration';
import {defineStore} from 'statebuilder';
import {withProxyCommands} from 'statebuilder/commands';

export function getInitialFrameState(): FrameState {
  return {
    // lazy initialization
    background: null,
    padding: 64,
    radius: 8,
    visible: true,
    opacity: 100,
    autoWidth: false,
    scale: 1,
    width: 0,
    height: 0,
    aspectRatio: null,
    exportTarget: null,
    signature: null,
  };
}

type Commands = {
  setBackground: string;
  setOpacity: number;
  setPadding: number;
  setRadius: number;
  setScale: number;
  setAutoWidth: boolean;
  setWidth: number;
  setHeight: number;
  setVisibility: boolean;
  toggleVisibility: void;
  setNextPadding: void;
  setFromPreset: PresetData['frame'];
  setFromPersistedState: PersistedFrameState;
  setSignature: FrameState['signature'];
  setAspectRatio: string | null;
  setExportTarget: FrameState['exportTarget'];
};

const frameState = defineStore(() => getInitialFrameState())
  .extend(withProxyCommands<Commands>())
  .extend(store => {
    store
      .hold(store.commands.setBackground, (background, {state}) => ({
        ...state,
        background,
      }))
      .hold(store.commands.setOpacity, (opacity, {state}) => ({
        ...state,
        opacity,
      }))
      .hold(store.commands.setPadding, (padding, {state}) => ({
        ...state,
        padding,
      }))
      .hold(store.commands.setRadius, (radius, {state}) => ({
        ...state,
        radius,
      }))
      .hold(store.commands.setScale, (scale, {state}) => ({
        ...state,
        scale,
      }))
      .hold(store.commands.setAutoWidth, (autoWidth, {state}) => ({
        ...state,
        autoWidth,
      }))
      .hold(store.commands.setVisibility, (visible, {state}) => ({
        ...state,
        visible,
      }))
      .hold(store.commands.toggleVisibility, (_, {state}) => ({
        ...state,
        visible: !state.visible,
      }))
      .hold(store.commands.setWidth, (width, {state}) => ({
        ...state,
        width,
      }))
      .hold(store.commands.setHeight, (height, {state}) => ({
        ...state,
        height,
      }))
      .hold(store.commands.setNextPadding, (_, {state}) => {
        const availablePadding = appEnvironment.editorPadding;
        const padding = state.padding;
        const currentIndex = appEnvironment.editorPadding.findIndex(
          item => Number(item.value) === padding,
        );
        const next = (currentIndex + 1) % availablePadding.length;
        return {...state, padding: Number(availablePadding[next].value)};
      })
      .hold(store.commands.setFromPreset, presetData => {
        store.set(state => ({
          ...state,
          ...presetData,
          signature: parseSignature(presetData.signature),
          aspectRatio: presetData.aspectRatio ?? null,
          exportTarget: presetData.exportTarget ?? null,
        }));
      })
      .hold(store.commands.setFromPersistedState, (_, {state}) => {
        return {
          ...state,
          ..._,
          signature: parseSignature(_.signature),
          aspectRatio: _.aspectRatio ?? null,
          exportTarget: _.exportTarget ?? null,
        };
      })
      .hold(store.commands.setSignature, (signature, {state}) => ({
        ...state,
        signature,
      }))
      .hold(store.commands.setExportTarget, (exportTarget, {state}) => ({
        ...state,
        exportTarget,
        aspectRatio: null,
      }))
      .hold(store.commands.setAspectRatio, (aspectRatio, {state}) => {
        return {...state, aspectRatio, exportTarget: null};
      });
  })
  .extend(store => {
    const exportTarget = createMemo(() =>
      getExportTarget(store().exportTarget),
    );
    const exportPixelRatio = (pixelRatio: number) =>
      exportTarget() ? 1 : pixelRatio;
    const mapToStateToPersistState = (
      state: FrameState,
    ): PersistedFrameState => {
      return {
        background: state.background,
        opacity: state.opacity,
        padding: state.padding,
        visible: state.visible,
        radius: state.radius,
        signature: state.signature,
        aspectRatio: state.aspectRatio,
        exportTarget: state.exportTarget,
      };
    };

    const persistence = store.watchCommand([
      store.commands.setBackground,
      store.commands.setOpacity,
      store.commands.setPadding,
      store.commands.setRadius,
      store.commands.setScale,
      store.commands.setAutoWidth,
      store.commands.setVisibility,
      store.commands.setNextPadding,
      store.commands.setFromPreset,
      store.commands.setSignature,
      store.commands.setAspectRatio,
      store.commands.setExportTarget,
    ]);

    return {
      get store() {
        return store.get;
      },
      exportTarget,
      exportPixelRatio,
      setStore: store.set,
      onPersistedChange(listener: (state: PersistedFrameState) => void) {
        const subscription = persistence.subscribe(() =>
          listener(mapToStateToPersistState(store.peek())),
        );
        return () => subscription.unsubscribe();
      },
      stateToPersist() {
        const state = store.peek();
        return mapToStateToPersistState(state);
      },
      ...store.actions,
    };
  });

export function getFrameState() {
  return provideAppState(frameState);
}
