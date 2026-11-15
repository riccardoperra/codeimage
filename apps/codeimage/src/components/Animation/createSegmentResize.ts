import type {AnimationSegment} from '@codeimage/store/editor/animationSettings';
import {onCleanup} from 'solid-js';
export const resizedDuration = (
  initial: number,
  pixels: number,
  width: number,
  total: number,
  alt: boolean,
  limits: {min: number; max: number},
) => {
  const snap = alt ? 10 : 100;
  return Math.min(
    limits.max,
    Math.max(
      limits.min,
      Math.round((initial + (pixels / width) * total) / snap) * snap,
    ),
  );
};
export function createSegmentResize(options: {
  total: () => number;
  width: () => number;
  limits: (segment: AnimationSegment) => {min: number; max: number};
  begin: (total: number) => void;
  end: () => void;
  update: (segment: AnimationSegment, ms: number, commit: boolean) => void;
}) {
  let drag:
    | {
        segment: AnimationSegment;
        pointerId: number;
        x: number;
        total: number;
        width: number;
        value: number;
      }
    | undefined;
  const move = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.value = resizedDuration(
      drag.segment.durationMs,
      event.clientX - drag.x,
      drag.width,
      drag.total,
      event.altKey,
      options.limits(drag.segment),
    );
    options.update(drag.segment, drag.value, false);
  };
  const detach = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', finish);
    window.removeEventListener('pointercancel', cancel);
  };
  const finish = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    move(event);
    const {segment, value} = drag;
    drag = undefined;
    detach();
    options.update(segment, value, true);
    options.end();
  };
  const cancel = () => {
    if (!drag) return;
    const {segment} = drag;
    drag = undefined;
    detach();
    options.update(segment, segment.durationMs, false);
    options.end();
  };
  onCleanup(cancel);
  return (event: PointerEvent, segment: AnimationSegment) => {
    if (event.button !== 0 || drag) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget instanceof HTMLElement)
      event.currentTarget
        .closest<HTMLElement>('[data-animation-segment]')
        ?.focus();
    const total = options.total();
    drag = {
      segment,
      pointerId: event.pointerId,
      x: event.clientX,
      total,
      width: Math.max(1, options.width()),
      value: segment.durationMs,
    };
    options.begin(total);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', cancel);
  };
}
