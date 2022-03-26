import {createEffect, onMount} from 'solid-js';

export const svgNodeFilter: NodeFilter = (node: Node) =>
  'ownerSVGElement' in node
    ? NodeFilter.FILTER_REJECT
    : NodeFilter.FILTER_ACCEPT;

export function highlight(el: HTMLElement, text: () => string): void {
  const highlightVar = '--highlight-color';

  const treeWalker = document.createTreeWalker(
    el,
    NodeFilter.SHOW_TEXT,
    svgNodeFilter,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore @bad typescript lib types
    false,
  );

  el.style.position = 'relative';
  el.style.zIndex = '0';

  const highlightEl = prepareHighlightEl();

  onMount(() => computeHighlight());
  createEffect(() => computeHighlight());

  function computeHighlight() {
    highlightEl.style.display = 'none';

    const matched = getHighlightIndexOf(el.textContent) !== -1;
    if (!matched) {
      return;
    }

    treeWalker.currentNode = el;

    do {
      const index = getHighlightIndexOf(treeWalker.currentNode.nodeValue);
      if (index === -1) {
        continue;
      }

      const range = document.createRange();
      range.setStart(treeWalker.currentNode, index);
      range.setEnd(treeWalker.currentNode, index + text().length);

      const hostRect = el.getBoundingClientRect();
      const {left, top, width, height} = range.getBoundingClientRect();
      const style = highlightEl.style;

      style.backgroundColor = `var(${highlightVar})`;
      style.left = toPx(left - hostRect.left);
      style.top = toPx(top - hostRect.top);
      style.width = toPx(width);
      style.height = toPx(height);
      style.display = 'block';

      return;
    } while (treeWalker.nextNode());
  }

  function getHighlightIndexOf(source: string | null): number {
    const highlight = text();
    return !source || !highlight
      ? -1
      : source.toLowerCase().indexOf(highlight.toLowerCase());
  }

  function prepareHighlightEl(): HTMLElement {
    const highlight = document.createElement('div');
    const {style} = highlight;
    style.backgroundColor = `var(${highlightVar})`;
    style.zIndex = '-1';
    style.position = 'absolute';
    onMount(() => el.appendChild(highlight));
    return highlight;
  }

  function toPx(value: number): string {
    return `${value}px`;
  }
}

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface Directives {
      highlight?: string;
    }
  }
}
