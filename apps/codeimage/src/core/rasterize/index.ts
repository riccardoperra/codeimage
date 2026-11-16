import type {CustomFontConfiguration} from '../configuration/font';
import {ExportFontError} from './font-error';
import {notifyFontFallback} from './notify-font-fallback';
import {getUmami} from '../constants/umami';
import {domExport} from './domExport';
import {withoutAnimateAids} from '../animation/aids';

export type RasterizerName = 'dom-export' | 'takumi';

export interface RasterizeOptions {
  format: 'png' | 'jpeg' | 'svg';
  pixelRatio: number;
  quality: number;
  codeFont: CustomFontConfiguration;
}

export type Rasterizer = (
  node: HTMLElement,
  options: RasterizeOptions,
) => Promise<Blob | string>;

export function createRasterizer(
  renderer: RasterizerName,
  output: 'blob' | 'dataUrl',
): Rasterizer {
  const fallback = domExport(output);
  const rasterize: Rasterizer =
    renderer !== 'takumi'
      ? fallback
      : async (node, options) => {
          try {
            const {takumi} = await import('./takumi');
            return await takumi(node, options);
          } catch (error) {
            console.error(
              '[CodeImage] Takumi export failed. Using dom-export.',
              error,
            );
            if (error instanceof ExportFontError) notifyFontFallback(error);
            getUmami().track('export-renderer-fallback', {
              renderer: 'takumi',
              format: options.format,
              error: error instanceof Error ? error.name : 'UnknownError',
            });
            return fallback(node, options);
          }
        };
  return (node, options) => withoutAnimateAids(() => rasterize(node, options));
}
