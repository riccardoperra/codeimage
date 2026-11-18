import {Plugin} from '@dnd-kit/abstract';
import type {DragDropManager} from '@dnd-kit/dom';
import {DOMRectangle} from '@dnd-kit/dom/utilities';

export class TabDragFeedback extends Plugin<DragDropManager> {
  constructor(manager: DragDropManager) {
    super(manager);
    const {dragOperation} = manager;
    this.registerEffect(() => {
      if (!dragOperation.status.dragging) return;
      const element = dragOperation.source?.element;
      if (!(element instanceof HTMLElement)) return;

      const {x} = dragOperation.transform;
      element.style.translate = `${x / (element.currentCSSZoom || 1)}px`;
      dragOperation.shape = new DOMRectangle(element);

      return () => element.style.removeProperty('translate');
    });
  }
}
