import {getFrameState} from '@codeimage/store/editor/frame';
import {provideAppState} from '@codeimage/store/index';
import {withIndexedDbPlugin} from '@codeimage/store/plugins/withIndexedDbPlugin';
import {createResizeObserver} from '@solid-primitives/resize-observer';
import type {Accessor} from 'solid-js';
import {defineStore} from 'statebuilder';
import {getWhatsNew} from './whats-new';
import {ExportExtension} from '../hooks/use-export-image';

export interface PersistedExportCanvasSettings {
  devicePixelRatio: number;
  jpegQuality: number;
  extension: ExportExtension;
  showOnlyActiveTab: boolean;
  oneImagePerTab: boolean;
}

export const ExportCanvasStore = defineStore(() => ({
  canvasSize: {
    width: 0,
    height: 0,
  },
  devicePixelRatio: 3,
  jpegQuality: 100,
  extension: ExportExtension.png,
  showOnlyActiveTab: false,
  oneImagePerTab: false,
}))
  .extend(
    withIndexedDbPlugin<PersistedExportCanvasSettings>('exportSettings', {
      devicePixelRatio: 3,
      jpegQuality: 100,
      extension: ExportExtension.png,
      showOnlyActiveTab: false,
      oneImagePerTab: false,
    }),
  )
  .extend((store, context) => {
    let disposed = false;
    context.onDispose(() => {
      disposed = true;
    });
    context.onMount(async () => {
      const value = await store.idb.get();
      if (disposed) return;
      store.set(draft => {
        Object.assign(draft, value);
      });
      context.onSet(value => {
        store.idb.set({
          devicePixelRatio: value.devicePixelRatio,
          jpegQuality: value.jpegQuality,
          extension: value.extension,
          showOnlyActiveTab: value.showOnlyActiveTab,
          oneImagePerTab: value.oneImagePerTab,
        });
      });
    });
  })
  .extend(store => ({
    canvasResolution() {
      const target = getFrameState().exportTarget();
      if (target) return target.resolution.join('x');
      const canvasSize = store.get.canvasSize;
      const height = Math.ceil(canvasSize.height) * store.get.devicePixelRatio;
      const width = Math.ceil(canvasSize.width) * store.get.devicePixelRatio;
      return `${width}x${height}`;
    },
    setCanvasSize(width: number, height: number) {
      store.set(state => {
        state.canvasSize = {width, height};
      });
    },
    setExtension(value: ExportExtension) {
      store.set(draft => {
        draft.extension = value;
      });
    },
    setJpegQuality(value: number) {
      store.set(draft => {
        draft.jpegQuality = value;
      });
    },
    setDevicePixelRatio(value: number) {
      store.set(draft => {
        draft.devicePixelRatio = value;
      });
    },
    setShowOnlyActiveTab(value: boolean) {
      store.set(state => {
        state.showOnlyActiveTab = value;
      });
    },
    setOneImagePerTab(value: boolean) {
      if (value) getWhatsNew().seen('tabs');
      store.set(state => {
        state.oneImagePerTab = value;
      });
    },
    initCanvas(el: Accessor<HTMLElement | undefined>) {
      createResizeObserver(el, ref => {
        setTimeout(() => {
          this.setCanvasSize(ref.width, ref.height);
        });
      });
    },
  }));

function createExportCanvasStore() {
  return provideAppState(ExportCanvasStore);
}

let exportCanvasStore: ReturnType<typeof createExportCanvasStore> | undefined;

export function getExportCanvasStore() {
  return (exportCanvasStore ??= createExportCanvasStore());
}
