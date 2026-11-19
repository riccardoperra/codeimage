import {createEffect, createSignal, onCleanup} from 'solid-js';

const svgNodeFilter: NodeFilter = (node: Node) =>
  'ownerSVGElement' in node
    ? NodeFilter.FILTER_REJECT
    : NodeFilter.FILTER_ACCEPT;

function toPx(value: number): string {
  return `${value}px`;
}

function paintHighlight(
  element: HTMLElement,
  marker: HTMLElement,
  query: string,
) {
  marker.style.display = 'none';
  if (!query) return;

  const target = query.toLowerCase();
  const treeWalker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    svgNodeFilter,
  );
  let node = treeWalker.nextNode();
  while (node) {
    const index = node.nodeValue?.toLowerCase().indexOf(target) ?? -1;
    if (index !== -1) {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + query.length);
      const hostRect = element.getBoundingClientRect();
      const {left, top, width, height} = range.getBoundingClientRect();
      marker.style.left = toPx(left - hostRect.left);
      marker.style.top = toPx(top - hostRect.top);
      marker.style.width = toPx(width);
      marker.style.height = toPx(height);
      marker.style.display = 'block';
      return;
    }
    node = treeWalker.nextNode();
  }
}

export function createHighlight(text: () => string) {
  const [element, setElement] = createSignal<HTMLElement>();
  const marker = document.createElement('div');
  marker.style.position = 'absolute';
  marker.style.zIndex = '-1';
  marker.style.backgroundColor = 'var(--highlight-color)';

  createEffect(
    () => [element(), text()] as const,
    ([target, query]) => {
      if (!target) return;
      if (marker.parentElement !== target) {
        target.style.position = 'relative';
        target.style.zIndex = '0';
        target.appendChild(marker);
      }
      paintHighlight(target, marker, query);
    },
  );
  onCleanup(() => marker.remove());
  return setElement;
}
