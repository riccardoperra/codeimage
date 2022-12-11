import {createEffect, createMemo, createRoot, createSignal, on} from 'solid-js';
import {injectBreakpoints} from '~/theme/breakpoints';
import {getUiStore} from '~/ui';

export function createEditorScene() {
  const [progress, setProgress] = createSignal(0);
  const [inView, setInView] = createSignal(false);
  const breakpoints = injectBreakpoints();
  const uiStore = getUiStore();

  const [ref, setRef] = createSignal<HTMLElement>();
  const stepsOffset = [0, 33, 66];

  const stepsMainColors = {
    0: '#1777f8',
    1: '#d554f7',
    2: '#8000FF',
  };

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

  const currentStep = createMemo(() => getStep(progress()));

  const canAnimateNavbar = createMemo(() => progress() > 0);

  createEffect(
    on(
      [inView, canAnimateNavbar, currentStep],
      ([inView, canAnimateNavbar, currentStep]) => {
        if (!inView) {
          uiStore.set('navColor', undefined);
        } else if (canAnimateNavbar) {
          uiStore.set('navColor', stepsMainColors[currentStep]);
        }
      },
    ),
  );

  return {
    ref,
    setRef,
    progress: createMemo(() => progress()),
    setProgress,
    inView,
    setInView,
    enableCircleExpansionGradient,
    stepsMainColors,
    get currentStep() {
      return currentStep();
    },
  };
}

const editorStepsScene = createRoot(createEditorScene);

export function injectEditorScene() {
  return editorStepsScene;
}
