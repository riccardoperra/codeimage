import type {TabScript} from '@codeimage/store/editor/model';

export function removeScriptStep(
  script: TabScript,
  step: number,
): TabScript | undefined {
  if (script.steps.length <= 2) return;
  const steps = script.steps.filter((_, index) => index !== step - 1);
  const shift = (value: number) => (value > step ? value - 1 : value);
  const lines = script.lines.map(rule => {
    const enter = Math.min(shift(rule.enter ?? 1), steps.length);
    const leave = rule.leave === undefined ? undefined : shift(rule.leave);
    const focus = rule.focus?.filter(value => value !== step).map(shift);
    return {
      line: rule.line,
      ...(enter > 1 ? {enter} : {}),
      ...(leave !== undefined && leave > enter && leave <= steps.length
        ? {leave}
        : {}),
      ...(focus?.length ? {focus} : {}),
    };
  });
  return {steps, lines};
}
