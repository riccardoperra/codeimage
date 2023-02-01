import {isIOS} from '@solid-primitives/platform';
import {clonePseudoElements} from './clonePseudoElements';
import {copyFont, copyUserComputedStyleFast} from './cloneStyle';
import {getBlobFromURL} from './getBlobFromURL';
import {Options} from './options';
import {createImage, getMimeType, makeDataUrl, toArray} from './util';

async function cloneCanvasElement(canvas: HTMLCanvasElement) {
  const dataURL = canvas.toDataURL();
  if (dataURL === 'data:,') {
    return canvas.cloneNode(false) as HTMLCanvasElement;
  }

  return createImage(dataURL);
}

async function cloneVideoElement(video: HTMLVideoElement, options: Options) {
  const poster = video.poster;
  const metadata = await getBlobFromURL(poster, options);
  const dataURL = makeDataUrl(
    metadata.blob,
    getMimeType(poster) || metadata.contentType,
  );
  return createImage(dataURL);
}

async function cloneSingleNode<T extends HTMLElement>(
  node: T,
  options: Options,
): Promise<HTMLElement> {
  if (node instanceof HTMLCanvasElement) {
    return cloneCanvasElement(node);
  }

  if (node instanceof HTMLVideoElement && node.poster) {
    return cloneVideoElement(node, options);
  }

  return node.cloneNode(false) as T;
}

const isSlotElement = (node: HTMLElement): node is HTMLSlotElement =>
  node.tagName != null && node.tagName.toUpperCase() === 'SLOT';

async function cloneChildren<T extends HTMLElement>(
  nativeNode: T,
  clonedNode: T,
  options: Options,
): Promise<T> {
  const children =
    isSlotElement(nativeNode) && nativeNode.assignedNodes
      ? toArray<T>(nativeNode.assignedNodes())
      : toArray<T>((nativeNode.shadowRoot ?? nativeNode).childNodes);

  if (children.length === 0 || nativeNode instanceof HTMLVideoElement) {
    return Promise.resolve(clonedNode);
  }

  await children.reduce((deferred, child) => {
    const computedStyles = getComputedStyle(nativeNode);
    return deferred
      .then(() => cloneNode(child, options, false, computedStyles))
      .then((clonedChild: HTMLElement | null) => {
        if (clonedChild) {
          clonedNode.appendChild(clonedChild);
        }
      });
  }, Promise.resolve());

  return clonedNode;
}

function cloneCSSStyle<T extends HTMLElement>(
  nativeNode: T,
  clonedNode: T,
  parentComputedStyles: CSSStyleDeclaration | null,
) {
  const nativeComputedStyle = getComputedStyle(nativeNode);
  const sourceStyle = clonedNode.style;
  if (nativeComputedStyle.cssText) {
    clonedNode.style.cssText = nativeComputedStyle.cssText;
    copyFont(nativeComputedStyle, clonedNode.style); // here we re-assign the font props.
  } else {
    copyUserComputedStyleFast(
      nativeComputedStyle,
      parentComputedStyles,
      clonedNode,
    );
  }

  const webkitBackgroundClip = sourceStyle.getPropertyValue(
    '-webkit-background-clip',
  );
  if (webkitBackgroundClip !== 'border-box') {
    clonedNode.setAttribute(
      'style',
      `${clonedNode.getAttribute(
        'style',
      )};-webkit-background-clip:${webkitBackgroundClip};`,
    );
  }

  // fix for flex align bug in safari
  const alignItems = sourceStyle.getPropertyValue('align-items');
  if (alignItems !== 'normal') {
    clonedNode.setAttribute(
      'style',
      `${clonedNode.getAttribute('style')};align-items:${alignItems};`,
    );
  }

  // fix for perspective bug in safari
  const perspective = sourceStyle.getPropertyValue('perspective');
  if (perspective !== 'none') {
    clonedNode.setAttribute(
      'style',
      `${clonedNode.getAttribute('style')};perspective:${perspective};`,
    );
  }

  const boxShadow = sourceStyle.getPropertyValue('boxShadow');
  if (boxShadow !== 'none' && isIOS) {
    clonedNode.setAttribute(
      'style',
      `${clonedNode.getAttribute('style')};box-shadow:none!important;`,
    );
  }
}

function cloneInputValue<T extends HTMLElement>(nativeNode: T, clonedNode: T) {
  if (nativeNode instanceof HTMLTextAreaElement) {
    clonedNode.innerHTML = nativeNode.value;
  }

  if (nativeNode instanceof HTMLInputElement) {
    clonedNode.setAttribute('value', nativeNode.value);
  }
}

function cloneSelectValue<T extends HTMLElement>(nativeNode: T, clonedNode: T) {
  if (nativeNode instanceof HTMLSelectElement) {
    const clonedSelect = clonedNode as any as HTMLSelectElement;
    const selectedOption = Array.from(clonedSelect.children).find(
      child => nativeNode.value === child.getAttribute('value'),
    );

    if (selectedOption) {
      selectedOption.setAttribute('selected', '');
    }
  }
}

async function decorate<T extends HTMLElement>(
  nativeNode: T,
  clonedNode: T,
  parentComputedStyles: CSSStyleDeclaration | null,
): Promise<T> {
  if (!(clonedNode instanceof Element)) {
    return clonedNode;
  }

  cloneCSSStyle(nativeNode, clonedNode, parentComputedStyles);
  clonePseudoElements(nativeNode, clonedNode);
  cloneInputValue(nativeNode, clonedNode);
  cloneSelectValue(nativeNode, clonedNode);

  return clonedNode;
}

async function ensureSVGSymbols<T extends HTMLElement>(
  clone: T,
  options: Options,
) {
  const uses = clone.querySelectorAll ? clone.querySelectorAll('use') : [];
  if (uses.length === 0) {
    return clone;
  }

  const processedDefs: {[key: string]: HTMLElement} = {};
  for (let i = 0; i < uses.length; i++) {
    const use = uses[i];
    const id = use.getAttribute('xlink:href');
    if (id) {
      const exist = clone.querySelector(id);
      const definition = document.querySelector(id) as HTMLElement;
      if (!exist && definition && !processedDefs[id]) {
        // eslint-disable-next-line no-await-in-loop
        processedDefs[id] = (await cloneNode(definition, options, true, null))!;
      }
    }
  }

  const nodes = Object.values(processedDefs);
  if (nodes.length) {
    const ns = 'http://www.w3.org/1999/xhtml';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('xmlns', ns);
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    svg.style.overflow = 'hidden';
    svg.style.display = 'none';

    const defs = document.createElementNS(ns, 'defs');
    svg.appendChild(defs);

    for (let i = 0; i < nodes.length; i++) {
      defs.appendChild(nodes[i]);
    }

    clone.appendChild(svg);
  }

  return clone;
}

export async function cloneNode<T extends HTMLElement>(
  node: T,
  options: Options,
  isRoot?: boolean,
  parentComputedStyles?: CSSStyleDeclaration | null,
): Promise<T | null> {
  if (!isRoot && options.filter && !options.filter(node)) {
    return null;
  }

  return Promise.resolve(node)
    .then(clonedNode => cloneSingleNode(clonedNode, options) as Promise<T>)
    .then(clonedNode => cloneChildren(node, clonedNode, options))
    .then(clonedNode =>
      decorate(node, clonedNode, parentComputedStyles ?? null),
    )
    .then(clonedNode => ensureSVGSymbols(clonedNode, options));
}
