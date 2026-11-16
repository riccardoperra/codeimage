import {createMemo, type Accessor} from 'solid-js';
import {getEditorStore} from '@codeimage/store/editor';
import {animateAidsHidden} from '@core/animation/aids';
import {scriptLinesExtension} from './index';

export function createScriptAids(
  readOnly: Accessor<boolean>,
  editorId: Accessor<string | undefined>,
) {
  const scriptAidStep = createMemo(() => {
    const {animation} = getEditorStore();
    if (readOnly() || !animation.open() || animateAidsHidden()) return false;
    const selected = animation.selection();
    const selectedStep = animation
      .settings()
      .steps.find(
        step => step.id === selected?.stepId && step.editorId === editorId(),
      );
    const step = selectedStep?.view;
    return step?.kind === 'script' ? step.step : null;
  });
  return () => {
    const step = scriptAidStep();
    return step === false ? [] : scriptLinesExtension(step);
  };
}
