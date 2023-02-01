import {resourceToDataURL} from './dataurl';
import {embedResources} from './embedResources';
import {Options} from './options';
import {getMimeType, isDataUrl, toArray} from './util';

async function embedBackground<T extends HTMLElement>(
  clonedNode: T,
  options: Options,
) {
  const background = clonedNode.style?.getPropertyValue('background');
  if (background) {
    const cssString = await embedResources(background, null, options);
    clonedNode.style.setProperty(
      'background',
      cssString,
      clonedNode.style.getPropertyPriority('background'),
    );
  }
}

async function embedImageNode<T extends HTMLElement | SVGImageElement>(
  clonedNode: T,
  options: Options,
) {
  if (
    !(clonedNode instanceof HTMLImageElement && !isDataUrl(clonedNode.src)) &&
    !(
      clonedNode instanceof SVGImageElement &&
      !isDataUrl(clonedNode.href.baseVal)
    )
  ) {
    return;
  }

  const url =
    clonedNode instanceof HTMLImageElement
      ? clonedNode.src
      : clonedNode.href.baseVal;

  const dataURL = await resourceToDataURL(url, getMimeType(url), options);
  await new Promise((resolve, reject) => {
    clonedNode.onload = resolve;
    clonedNode.onerror = reject;

    const image = clonedNode as HTMLImageElement;
    if (image.decode) {
      image.decode = resolve as any;
    }

    if (clonedNode instanceof HTMLImageElement) {
      clonedNode.srcset = '';
      clonedNode.src = dataURL;
    } else {
      clonedNode.href.baseVal = dataURL;
    }
  });
}

async function embedChildren<T extends HTMLElement>(
  clonedNode: T,
  options: Options,
) {
  const children = toArray<HTMLElement>(clonedNode.childNodes);
  const deferreds = children.map(child => embedImages(child, options));
  await Promise.all(deferreds).then(() => clonedNode);
}

export async function embedImages<T extends HTMLElement>(
  clonedNode: T,
  options: Options,
) {
  if (clonedNode instanceof Element) {
    await embedBackground(clonedNode, options);
    await embedImageNode(clonedNode, options);
    await embedChildren(clonedNode, options);
  }
}
