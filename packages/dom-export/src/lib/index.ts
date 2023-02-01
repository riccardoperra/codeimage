import {applyStyleFromOptions} from './applyStyleFromOptions';
import {cloneNode} from './cloneNode';
import {removeSandbox} from './cloneStyle';
import {embedImages} from './embedImages';
import {embedWebFonts, getWebFontCSS} from './embedWebFonts';
import {Options} from './options';
import {
  canvasToBlob,
  createImage,
  getImageSize,
  getPixelRatio,
  nodeToDataURL,
} from './util';

export async function toSvg<T extends HTMLElement>(
  node: T,
  options: Options = {},
): Promise<string> {
  const {width, height} = getImageSize(node, options);
  const clonedNode = (await cloneNode(node, options, true)) as HTMLElement;
  await embedWebFonts(clonedNode, options);
  await embedImages(clonedNode, options);
  applyStyleFromOptions(clonedNode, options);
  const datauri = await nodeToDataURL(clonedNode, width, height);
  return datauri;
}

const dimensionCanvasLimit = 16384; // as per https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#maximum_canvas_size

function checkCanvasDimensions(canvas: HTMLCanvasElement) {
  if (
    canvas.width > dimensionCanvasLimit ||
    canvas.height > dimensionCanvasLimit
  ) {
    if (
      canvas.width > dimensionCanvasLimit &&
      canvas.height > dimensionCanvasLimit
    ) {
      if (canvas.width > canvas.height) {
        canvas.height *= dimensionCanvasLimit / canvas.width;
        canvas.width = dimensionCanvasLimit;
      } else {
        canvas.width *= dimensionCanvasLimit / canvas.height;
        canvas.height = dimensionCanvasLimit;
      }
    } else if (canvas.width > dimensionCanvasLimit) {
      canvas.height *= dimensionCanvasLimit / canvas.width;
      canvas.width = dimensionCanvasLimit;
    } else {
      canvas.width *= dimensionCanvasLimit / canvas.height;
      canvas.height = dimensionCanvasLimit;
    }
  }
}

export async function toCanvas<T extends HTMLElement>(
  node: T,
  options: Options = {},
): Promise<HTMLCanvasElement> {
  const svg = await toSvg(node, options);
  const img = await createImage(svg);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  const ratio = options.pixelRatio || getPixelRatio();
  const {width, height} = getImageSize(node, options);
  const canvasWidth = options.canvasWidth || width;
  const canvasHeight = options.canvasHeight || height;

  canvas.width = canvasWidth * ratio;
  canvas.height = canvasHeight * ratio;

  if (!options.skipAutoScale) {
    checkCanvasDimensions(canvas);
  }
  canvas.style.width = `${canvasWidth}`;
  canvas.style.height = `${canvasHeight}`;

  if (options.backgroundColor) {
    context.fillStyle = options.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.drawImage(img, 0, 0, canvas.width, canvas.height);

  removeSandbox();

  return canvas;
}

export async function toPixelData<T extends HTMLElement>(
  node: T,
  options: Options = {},
): Promise<Uint8ClampedArray> {
  const {width, height} = getImageSize(node, options);
  const canvas = await toCanvas(node, options);
  const ctx = canvas.getContext('2d')!;
  return ctx.getImageData(0, 0, width, height).data;
}

export async function toPng<T extends HTMLElement>(
  node: T,
  options: Options = {},
): Promise<string> {
  const canvas = await toCanvas(node, options);
  return canvas.toDataURL();
}

export async function toJpeg<T extends HTMLElement>(
  node: T,
  options: Options = {},
): Promise<string> {
  const canvas = await toCanvas(node, options);
  return canvas.toDataURL('image/jpeg', options.quality || 1);
}

export async function toBlob<T extends HTMLElement>(
  node: T,
  options: Options = {},
): Promise<Blob | null> {
  const canvas = await toCanvas(node, options);
  const blob = await canvasToBlob(canvas);
  return blob;
}

export async function getFontEmbedCSS<T extends HTMLElement>(
  node: T,
  options: Options = {},
): Promise<string> {
  return getWebFontCSS(node, options);
}
