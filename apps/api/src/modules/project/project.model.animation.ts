import {Value} from '@sinclair/typebox/value';
import {
  AnimationSettingsSchema,
  type AnimationSettings,
  TabMarksSchema,
  type TabMarks,
} from './project.contract.animation.js';

export function remapAnimationStep(
  step: AnimationSettings['steps'][number],
  tabIds: ReadonlyMap<string, string>,
): AnimationSettings['steps'][number] {
  const editorId = tabIds.get(step.editorId) ?? step.editorId;
  let id = step.id;
  if (step.view?.kind !== 'script' && step.id === step.editorId) id = editorId;
  else if (
    step.view?.kind === 'diff' &&
    step.id === `${step.editorId}:${step.view.side}`
  )
    id = `${editorId}:${step.view.side}`;
  return {...step, editorId, ...(id === undefined ? {} : {id})};
}

export function parseAnimationSettings(
  value: unknown,
): AnimationSettings | null {
  if (!Value.Check(AnimationSettingsSchema, value)) return null;
  const {steps, transitionMs} = value;
  const totalMs = steps.reduce(
    (total, step, index) =>
      total +
      step.holdMs +
      (index === 0 ? 0 : (step.transition?.ms ?? transitionMs)),
    0,
  );
  return totalMs > 0 ? value : null;
}

export function parseTabMarks(value: unknown): TabMarks {
  if (!Value.Check(TabMarksSchema, value)) return {lines: [], focusedLines: []};
  const script = value.script;
  if (script) {
    const seen = new Set<number>();
    const valid = script.lines.every(line => {
      if (seen.has(line.line)) return false;
      seen.add(line.line);
      return (
        (line.enter ?? 1) <= script.steps.length &&
        (line.leave === undefined ||
          ((line.enter ?? 1) < line.leave &&
            line.leave <= script.steps.length)) &&
        (line.focus ?? []).every(step => step <= script.steps.length)
      );
    });
    if (!valid) return {lines: value.lines, focusedLines: value.focusedLines};
  }
  return value;
}
