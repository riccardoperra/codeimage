import {getEditorStore} from '@codeimage/store/editor';
import {createEffect, createSignal, onSettled} from 'solid-js';
import {
  type Box,
  boxOf,
  morphBar,
  reshapeSurface,
} from '../../../components/Animation/BarMorph';
import {
  byPointer,
  reduced,
  timelineFor,
  toggledByPointer,
} from '../../../components/Animation/timeline/motion';
export type CanvasBarMode = 'actions' | 'transport';
type Mode = CanvasBarMode;
export function createCanvasBar(wanted: () => CanvasBarMode) {
  const {animation} = getEditorStore();
  const [mode, setMode] = createSignal(wanted());
  let bar!: HTMLDivElement;
  let surface!: HTMLSpanElement;
  let anchor!: HTMLDivElement;
  const groups: Record<Mode, {left?: HTMLDivElement; right?: HTMLDivElement}> =
    {actions: {}, transport: {}};
  const sides = (of: Mode) =>
    [groups[of].left, groups[of].right].filter(group => !!group);
  const width = (group?: HTMLElement) =>
    group?.getBoundingClientRect().width ?? 0;
  const lean = (of: Mode) => width(groups[of].left) - width(groups[of].right);
  let shown: {mode: Mode; box: Box} | undefined;
  const place = () => {
    bar.style.translate =
      mode() === 'transport'
        ? `${(lean('actions') - lean('transport')) / 2}px 0`
        : '';
    const was = shown;
    const box = boxOf(bar.getBoundingClientRect());
    const at = anchor.getBoundingClientRect();
    shown = {
      mode: mode(),
      box: {
        left: box.left - at.left,
        right: box.right - at.left,
        top: box.top - at.top,
        bottom: box.bottom - at.top,
      },
    };
    return was;
  };
  createEffect(mode, () => {
    place();
  });
  onSettled(() => {
    const observer = new ResizeObserver(() => {
      const was = place();
      const now = shown;
      const span = (box: Box) => box.right - box.left;
      if (!now || !was || was.mode !== now.mode || !byPointer() || reduced())
        return;
      if (Math.abs(span(was.box) - span(now.box)) < 1) return;
      const at = anchor.getBoundingClientRect();
      reshapeSurface({
        bar,
        surface,
        old: {
          left: at.left + was.box.left,
          right: at.left + was.box.right,
          top: at.top + was.box.top,
          bottom: at.top + was.box.bottom,
        },
        duration:
          span(now.box) > span(was.box)
            ? timelineFor.barIn
            : timelineFor.barClose,
      });
    });
    for (const group of [...sides('actions'), ...sides('transport')])
      observer.observe(group);
    return () => observer.disconnect();
  });
  createEffect(
    wanted,
    next => {
      if (next === mode() || !groups.transport.left) {
        setMode(next);
        return;
      }
      const opening = next === 'transport';
      const from = sides(opening ? 'actions' : 'transport');
      const to = sides(next);
      const hadFocus = from.some(group =>
        group.contains(document.activeElement),
      );
      morphBar({
        bar,
        surface,
        anchor,
        from,
        to,
        opening,
        animate: toggledByPointer(),
        change: () => setMode(next),
        done: () => {
          if (hadFocus)
            anchor.querySelector<HTMLElement>('[data-animate-toggle]')?.focus();
        },
      });
    },
    {defer: true},
  );
  const escape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || mode() !== 'transport') return;
    event.stopPropagation();
    event.preventDefault();
    animation.actions.setOpen(false);
  };

  return {
    mode,
    groups,
    escape,
    setBar: (element: HTMLDivElement) => {
      bar = element;
    },
    setSurface: (element: HTMLSpanElement) => {
      surface = element;
    },
    setAnchor: (element: HTMLDivElement) => {
      anchor = element;
    },
  };
}
