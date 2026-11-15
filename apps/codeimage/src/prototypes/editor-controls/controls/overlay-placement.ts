import {onCleanup} from 'solid-js';
import type {ControlId} from '../model';

/** Keep the editor over its panel or above the dock without resizing the canvas. */
export function placeControlOverlay(
  content: HTMLElement,
  opener: HTMLElement | undefined,
  target: ControlId | 'signature' | undefined,
) {
  const visible = (element: HTMLElement) => !!element.getClientRects().length;
  const dock = document.querySelector<HTMLElement>('[data-control-dock]');
  const panel =
    opener?.closest<HTMLElement>('[data-control-panel]') ??
    [...document.querySelectorAll<HTMLElement>('[data-control-panel]')].find(
      visible,
    );
  const group =
    target === 'frame.background' || target === 'frame.backgroundImage'
      ? 'background'
      : target === 'font.family'
        ? 'font'
        : 'more';
  const dockTrigger = dock?.querySelector<HTMLElement>(
    `button[data-panel="${group}"]`,
  );
  const anchor = dockTrigger ?? panel ?? opener;
  let box = anchor?.getBoundingClientRect();
  const place = () => {
    if (innerWidth <= 768) {
      for (const property of ['left', 'top', 'width', 'max-height'])
        content.style.removeProperty(property);
      return;
    }
    const current = anchor?.getBoundingClientRect();
    if (current?.width && current.height) box = current;
    const width = Math.min(!dock && box ? box.width : 360, innerWidth - 16);
    const dockTop = dock?.getBoundingClientRect().top;
    const height =
      dockTop !== undefined ? dockTop - 16 : (box?.height ?? innerHeight - 16);
    content.style.width = `${width}px`;
    content.style.maxHeight = `${Math.min(height, innerHeight - 16)}px`;
    const left = box
      ? Math.max(
          8,
          Math.min(
            dock ? box.left + (box.width - width) / 2 : box.left,
            innerWidth - width - 8,
          ),
        )
      : 8;
    const trigger = opener?.getBoundingClientRect();
    const top = box
      ? Math.max(
          8,
          Math.min(
            dockTop !== undefined
              ? dockTop - content.offsetHeight - 8
              : Math.max(
                  box.top,
                  Math.min(
                    trigger?.top ?? box.top,
                    box.bottom - content.offsetHeight,
                  ),
                ),
            innerHeight - content.offsetHeight - 8,
          ),
        )
      : 60;
    content.style.left = `${left}px`;
    content.style.top = `${top}px`;
  };
  const observer = new ResizeObserver(place);
  observer.observe(content);
  if (anchor) observer.observe(anchor);
  window.addEventListener('resize', place);
  place();
  onCleanup(() => {
    observer.disconnect();
    window.removeEventListener('resize', place);
  });
}
