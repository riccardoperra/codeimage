import {createMemo, createRoot, createSignal} from 'solid-js';
import {injectBreakpoints} from '~/core/breakpoints';

export function createEditorScene() {
  const [progress, setProgress] = createSignal(0);
  const [inView, setInView] = createSignal(false);
  const breakpoints = injectBreakpoints();

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

  const enableCircleExpansionGradient = () => !breakpoints.isXs();

  return {
    ref,
    setRef,
    progress: createMemo(() => progress()),
    setProgress,
    inView,
    setInView,
    enableCircleExpansionGradient,
    get currentStep() {
      return getStep(progress());
    },
  };
}

const editorStepsScene = createRoot(createEditorScene);

export function injectEditorScene() {
  return editorStepsScene;
}
