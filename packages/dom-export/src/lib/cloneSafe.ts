import {getNodeHeight, getNodeWidth} from './util';

export async function cloneNodeSafe(node: HTMLElement) {
  return Promise.resolve(node).then(el => {
    const clonedNode = el.cloneNode(true) as HTMLElement;

    const width = getNodeWidth(node);
    const height = getNodeHeight(node);
    clonedNode.style.setProperty('width', `${width}px`);
    clonedNode.style.setProperty('height', `${height}px`);

    clonedNode
      .querySelectorAll('[data-export-exclude=true]')
      .forEach(cb => cb.remove());

    const firstTab = clonedNode
      .querySelector('[data-tabs="1"]')
      ?.querySelector('[class*="Tab_undefined_compound"]');
    firstTab?.classList.forEach(c => {
      if (c.indexOf('Tab_undefined_compound') == 0) {
        firstTab.classList.remove(c);
      }
    });

    return clonedNode;
  });
}
