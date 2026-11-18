import {RestrictToHorizontalAxis} from '@dnd-kit/abstract/modifiers';
import {
  DragDropManager,
  Feedback,
  KeyboardSensor,
  defaultPreset,
  PointerSensor,
} from '@dnd-kit/dom';
import {Sortable, SortableKeyboardPlugin} from '@dnd-kit/dom/sortable';

export function createTabDragManager() {
  return new DragDropManager({
    modifiers: [RestrictToHorizontalAxis],
    plugins: defaultPreset.plugins.map(plugin =>
      plugin === Feedback
        ? Feedback.configure({dropAnimation: null, keyboardTransition: null})
        : plugin,
    ),
    sensors: [
      PointerSensor.configure({
        preventActivation: event =>
          event.target instanceof Element &&
          !!event.target.closest('input, button, [data-tab-close]'),
      }),
      KeyboardSensor.configure({
        keyboardCodes: {
          start: ['Space'],
          cancel: ['Escape'],
          end: ['Space', 'Enter', 'Tab'],
          up: [],
          down: [],
          left: ['ArrowLeft'],
          right: ['ArrowRight'],
        },
      }),
    ],
  });
}

export function registerSortableTab(
  manager: DragDropManager,
  tab: {id: string; element: HTMLElement; index: number},
) {
  return new Sortable(
    {
      ...tab,
      transition: null,
      plugins: [SortableKeyboardPlugin],
    },
    manager,
  );
}
