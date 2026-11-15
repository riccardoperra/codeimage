import type {SignatureTone} from './signatureColors';
import {luminance} from './signatureColors';

export const TONE_SAMPLE_SIZE = 24;

export function toneOfPixels(
  rgba: ArrayLike<number> | null,
  size = TONE_SAMPLE_SIZE,
): SignatureTone | null {
  if (!rgba || rgba.length !== size * size * 4) return null;
  let sum = 0;
  const top = Math.floor((size * 2) / 3);
  for (let i = top * size * 4; i < rgba.length; i += 4)
    sum += luminance([rgba[i], rgba[i + 1], rgba[i + 2]]);
  return sum / ((size - top) * size) > 0.45 ? 'light' : 'dark';
}

export async function canvasSample(url: string): Promise<Uint8ClampedArray> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = url;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = TONE_SAMPLE_SIZE;
  canvas.height = TONE_SAMPLE_SIZE;
  const context = canvas.getContext('2d', {willReadFrequently: true});
  if (!context) throw new Error('No canvas context for signature tone');
  context.drawImage(image, 0, 0, TONE_SAMPLE_SIZE, TONE_SAMPLE_SIZE);
  return context.getImageData(0, 0, TONE_SAMPLE_SIZE, TONE_SAMPLE_SIZE).data;
}

export function toneSampleMarkup(src: string): string {
  const escaped = src.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  return `<img src="${escaped}" style="display:block;width:${TONE_SAMPLE_SIZE}px;height:${TONE_SAMPLE_SIZE}px"/>`;
}
