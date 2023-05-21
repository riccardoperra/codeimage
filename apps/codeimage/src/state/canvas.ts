import {provideAppState} from '@codeimage/store/index';
import {withIndexedDbPlugin} from '@codeimage/store/plugins/withIndexedDbPlugin';
import {createResizeObserver} from '@solid-primitives/resize-observer';
import {Accessor, createEffect, on} from 'solid-js';
import {defineStore} from 'statebuilder';
import {ExportExtension} from '../hooks/use-export-image';

export interface PersistedExportCanvasSettings {
  devicePixelRatio: number;
  jpegQuality: number;
  extension: ExportExtension;
}

export const ExportCanvasStore = defineStore(() => ({
  canvasSize: {
    width: 0,
    height: 0,
  },
  devicePixelRatio: 3,
  jpegQuality: 100,
  extension: ExportExtension.png,
}))
  .extend(
    withIndexedDbPlugin<PersistedExportCanvasSettings>('exportSettings', {
      devicePixelRatio: 3,
      jpegQuality: 100,
      extension: ExportExtension.png,
    }),
  )
  .extend((store, context) => {
    createEffect(
      on(store, value => {
        store.idb.set({
          devicePixelRatio: value.devicePixelRatio,
          jpegQuality: value.jpegQuality,
          extension: value.extension,
        });
      }),
    );
    context.hooks.onInit(() => {
      store.idb.get().then(value =>
        store.set(prevValue => ({
          ...prevValue,
          ...value,
        })),
      );
    });
  })
  .extend(store => ({
    canvasResolution() {
      const canvasSize = store.get.canvasSize;
      const height = Math.ceil(canvasSize.height) * store.get.devicePixelRatio;
      const width = Math.ceil(canvasSize.width) * store.get.devicePixelRatio;
      return `${width}x${height}`;
    },
    setCanvasSize(width: number, height: number) {
      store.set('canvasSize', {width, height});
    },
    initCanvas(el: Accessor<HTMLElement | undefined>) {
      createResizeObserver(el, ref => {
        setTimeout(() => {
          this.setCanvasSize(ref.width, ref.height);
        });
      });
    },
  }));

export function getExportCanvasStore() {
  return provideAppState(ExportCanvasStore);
}
