import {createSignal} from 'solid-js';

export const TIMELINE_LAYOUTS = ['filmstrip', 'outline'] as const;
export type TimelineLayout = (typeof TIMELINE_LAYOUTS)[number];

const KEY = 'codeimage:animate-layout';

function initialLayout(): TimelineLayout {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'filmstrip' || stored === 'outline') return stored;
  } catch {
    return 'filmstrip';
  }
  return 'filmstrip';
}

const [layout, setLayoutSignal] = createSignal<TimelineLayout>(initialLayout());
export const timelineLayout = layout;
export function setTimelineLayout(value: TimelineLayout) {
  setLayoutSignal(value);
  try {
    localStorage.setItem(KEY, value);
  } catch {
    return;
  }
}
