import {getAssetsStore, isAssetUrl} from '@codeimage/store/assets/assets';
import type {Accessor} from 'solid-js';
import {createResource} from 'solid-js';
import type {SignatureTone} from './signatureColors';
import {luminance, toneOfBackground} from './signatureColors';

/** The bottom third of the image, where the signature sits. */
async function toneOfImage(url: string): Promise<SignatureTone> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = url;
  await image.decode();
  const size = 24;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d', {willReadFrequently: true});
  if (!context) return 'dark';
  context.drawImage(image, 0, 0, size, size);
  const top = Math.floor((size * 2) / 3);
  const {data} = context.getImageData(0, top, size, size - top);
  const values: number[] = [];
  for (let i = 0; i < data.length; i += 4)
    values.push(luminance([data[i], data[i + 1], data[i + 2]]));
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return average > 0.45 ? 'light' : 'dark';
}

/** The ink for the frame's background; an image is sampled once it loads. */
export function createSignatureTone(
  background: Accessor<string | null | undefined>,
): Accessor<SignatureTone> {
  const assets = getAssetsStore();
  const [imageTone] = createResource(
    () => {
      const value = background();
      if (!isAssetUrl(value)) return null;
      return assets.getAsset(value)()?.url ?? null;
    },
    url => toneOfImage(url).catch((): SignatureTone => 'dark'),
  );
  return () => {
    const value = background() ?? null;
    // Reading the resource before it settles would suspend the frame.
    if (isAssetUrl(value))
      return imageTone.state === 'ready' ? imageTone() : 'dark';
    return toneOfBackground(value);
  };
}
