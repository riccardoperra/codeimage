import {updateEditorStore} from '@codeimage/store/editor';
import {updateFrameStore} from '@codeimage/store/frame';
import {updateTerminalStore} from '@codeimage/store/terminal';
import {useSearchParams} from 'solid-app-router';
import {onMount} from 'solid-js';

export function connectStoreWithQueryParams() {
  const [searchParams] = useSearchParams();

  onMount(() => {
    const data = searchParams.p;

    if (data) {
      try {
        const params = JSON.parse(window.atob(data));
        if (params) {
          if (params.terminal) {
            updateTerminalStore(state => ({...state, ...params.terminal}));
          }
          if (params.editor) {
            updateEditorStore(state => ({...state, ...params.editor}));
          }
          if (params.frame) {
            updateFrameStore(state => ({...state, ...params.frame}));
          }
        }
      } catch (e) {
        console.warn('[CodeImage] Error while parsing query params data', e);
      }
    } else {
    }
  });
}
