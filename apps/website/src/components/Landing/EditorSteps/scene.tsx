import {createSign} from 'crypto';
import {
  createContext,
  createReaction,
  createRoot,
  createSignal,
  ParentProps,
} from 'solid-js';
import {createStore} from 'solid-js/store';

export function createEditorScene() {
  const [progress, setProgress] = createSignal(0);
  const [inView, setInView] = createSignal(false);

  const [ref, setRef] = createSignal<HTMLElement>();
  const stepsOffset = [0, 33, 66];

  function getStep(progress: number) {
    progress = Math.floor(progress);
    let index = 0;
    for (let i = stepsOffset.length; i--; ) {
      if (progress >= stepsOffset[i]) {
        index = i;
        break;
      }
    }
    return index;
  }

  return {
    ref,
    setRef,
    progress,
    setProgress,
    inView,
    setInView,
    get currentStep() {
      return getStep(progress());
    },
  };
}

const editorStepsScene = createRoot(createEditorScene);

export function injectEditorScene() {
  return editorStepsScene;
}
