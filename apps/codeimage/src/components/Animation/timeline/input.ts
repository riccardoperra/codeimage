import {onCleanup} from 'solid-js';

let modality: 'pointer' | 'keyboard' = 'keyboard';
if (typeof document !== 'undefined') {
  document.documentElement.dataset.animateInput = modality;
  document.addEventListener(
    'pointerdown',
    () => {
      modality = 'pointer';
      document.documentElement.dataset.animateInput = modality;
    },
    true,
  );
}
export const byPointer = () => modality === 'pointer';
let pointerToggle = false;
export function markPointerToggle(event: MouseEvent) {
  if (event.detail === 0) return;
  pointerToggle = true;
  setTimeout(() => {
    pointerToggle = false;
  });
}
export const toggledByPointer = () => pointerToggle;

export function createTimelineInputRef() {
  const keyboard = () => {
    modality = 'keyboard';
    document.documentElement.dataset.animateInput = modality;
  };
  let current: HTMLElement | undefined;
  const remove = () => current?.removeEventListener('keydown', keyboard, true);
  onCleanup(remove);
  return (root: HTMLElement) => {
    remove();
    current = root;
    root.addEventListener('keydown', keyboard, true);
  };
}
