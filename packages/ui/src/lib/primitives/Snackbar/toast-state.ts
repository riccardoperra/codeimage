import type {JSX} from '@solidjs/web';
import {createSignal} from 'solid-js';
import {scaleDuration} from '../Transition/Transition.css';

export const positions = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
] as const;

type ToastPosition = (typeof positions)[number];
type ToastKind = 'success' | 'error' | 'custom' | 'default';
type ToastMessage = JSX.Element | ((toast: ToastEntry) => JSX.Element);

interface ToastOptions {
  id?: string;
  theme?: string;
  className?: string;
  duration?: number;
  position?: ToastPosition;
  style?: JSX.CSSProperties;
  icon?: JSX.Element;
}

export interface ToastEntry extends Omit<
  ToastOptions,
  'id' | 'duration' | 'position'
> {
  id: string;
  kind: ToastKind;
  message: ToastMessage;
  position: ToastPosition;
  visible: boolean;
}

const durations: Record<ToastKind, number> = {
  success: 2000,
  error: 4000,
  custom: 4000,
  default: 4000,
};

const [entries, setEntries] = createSignal<ToastEntry[]>([], {
  ownedWrite: true,
});
const timeouts = new Map<string, ReturnType<typeof setTimeout> | undefined>();
let nextId = 0;

function nextToastId() {
  let id = String(++nextId);
  while (timeouts.has(id)) id = String(++nextId);
  return id;
}

function clearTimer(id: string) {
  clearTimeout(timeouts.get(id));
  timeouts.delete(id);
}

function remove(id?: string) {
  if (id === undefined) {
    for (const key of timeouts.keys()) clearTimer(key);
    setEntries([]);
    return;
  }

  clearTimer(id);
  setEntries(previous => previous.filter(entry => entry.id !== id));
}

function dismiss(id?: string) {
  const selected = id === undefined ? [...timeouts.keys()] : [id];
  for (const key of selected) {
    if (timeouts.has(key)) {
      clearTimer(key);
      timeouts.set(
        key,
        setTimeout(() => remove(key), scaleDuration),
      );
    }
  }
  setEntries(previous =>
    previous.map(entry =>
      id === undefined || entry.id === id ? {...entry, visible: false} : entry,
    ),
  );
}

function add(
  kind: ToastKind,
  message: ToastMessage,
  options: ToastOptions = {},
) {
  const {
    id = nextToastId(),
    duration = durations[kind],
    position = 'top-center',
    ...appearance
  } = options;
  const entry = {...appearance, id, kind, message, position, visible: true};
  clearTimer(id);
  setEntries(previous =>
    previous.some(existing => existing.id === id)
      ? previous.map(existing => (existing.id === id ? entry : existing))
      : [entry, ...previous],
  );
  const timeout = Number.isFinite(duration)
    ? setTimeout(() => dismiss(id), duration)
    : undefined;
  timeouts.set(id, timeout);
  return id;
}

export const toast = {
  success: (message: ToastMessage, options?: ToastOptions) =>
    add('success', message, options),
  error: (message: ToastMessage, options?: ToastOptions) =>
    add('error', message, options),
  custom: (message: ToastMessage, options?: ToastOptions) =>
    add('custom', message, options),
  default: (message: ToastMessage, options?: ToastOptions) =>
    add('default', message, options),
  dismiss,
  remove,
};

export {entries as toastEntries};
