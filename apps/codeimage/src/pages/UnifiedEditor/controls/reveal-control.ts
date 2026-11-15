import type {ControlId} from '../model';

/** One active layout owns this capability; callers need no layout knowledge. */
export function createControlRevealer() {
  let reveal: ((id: ControlId) => void) | undefined;
  return {
    register(handler: (id: ControlId) => void) {
      reveal = handler;
      return () => {
        if (reveal === handler) reveal = undefined;
      };
    },
    async reveal(id: ControlId) {
      reveal?.(id);
      // Wait for a mounted row and the panel's entrance, including phone sheets.
      let previous = '';
      let stable = 0;
      for (let frame = 0; frame < 90; frame++) {
        await new Promise<void>(resolve =>
          requestAnimationFrame(() => resolve()),
        );
        const row = [
          ...document.querySelectorAll<HTMLElement>(`[data-control="${id}"]`),
        ].find(
          element =>
            !element.closest('[inert], [aria-hidden="true"]') &&
            element.checkVisibility({visibilityProperty: true}),
        );
        if (!row) continue;
        row.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
          behavior: 'instant',
        });
        const rect = row.getBoundingClientRect();
        const position = `${rect.x},${rect.y},${rect.width},${rect.height}`;
        stable = position === previous ? stable + 1 : 0;
        previous = position;
        if (stable >= 4 && rect.top >= 0 && rect.bottom <= innerHeight) return;
      }
    },
  };
}
