import {clonePseudoElements} from './clonePseudoElements';
import {getBlobFromURL} from './getBlobFromURL';
import {Options} from './options';
import {createImage, getMimeType, makeDataUrl, toArray} from './util';
import {isIOS} from '@solid-primitives/platform';

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

  return Promise.resolve(node.cloneNode(false) as T);
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

  return children
    .reduce(
      (deferred, child) =>
        deferred
          .then(() => cloneNode(child, options))
          .then((clonedChild: HTMLElement | null) => {
            if (clonedChild) {
              clonedNode.appendChild(clonedChild);
            }
          }),
      Promise.resolve(),
    )
    .then(() => clonedNode);
}

function cloneCSSStyle<T extends HTMLElement>(nativeNode: T, clonedNode: T) {
  const source = window.getComputedStyle(nativeNode);
  const target = clonedNode.style;

  if (!target) {
    return;
  }

  // eslint-disable-next-line spaced-comment
  if (source.cssText) {
    target.cssText = source.cssText;
  } else {
    toArray<string>(source).forEach(name => {
      target.setProperty(
        name,
        source.getPropertyValue(name),
        source.getPropertyPriority(name),
      );
    });
  }

  const webkitBackgroundClip = source.getPropertyValue(
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
  const alignItems = source.getPropertyValue('align-items');
  if (alignItems !== 'normal') {
    clonedNode.setAttribute(
      'style',
      `${clonedNode.getAttribute('style')};align-items:${alignItems};`,
    );
  }

  // fix for perspective bug in safari
  const perspective = source.getPropertyValue('perspective');
  if (perspective !== 'none') {
    clonedNode.setAttribute(
      'style',
      `${clonedNode.getAttribute('style')};perspective:${perspective};`,
    );
  }

  const boxShadow = source.getPropertyValue('boxShadow');
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
): Promise<T> {
  if (!(clonedNode instanceof Element)) {
    return clonedNode;
  }

  cloneCSSStyle(nativeNode, clonedNode);
  clonePseudoElements(nativeNode, clonedNode);
  cloneInputValue(nativeNode, clonedNode);
  cloneSelectValue(nativeNode, clonedNode);

  return clonedNode;
}

export async function cloneNode<T extends HTMLElement>(
  node: T,
  options: Options,
  isRoot?: boolean,
): Promise<T | null> {
  if (!isRoot && options.filter && !options.filter(node)) {
    return null;
  }

  return Promise.resolve(node)
    .then(clonedNode => cloneSingleNode(clonedNode, options) as Promise<T>)
    .then(clonedNode => cloneChildren(node, clonedNode, options))
    .then(clonedNode => decorate(node, clonedNode));
}
