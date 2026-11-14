import type {HtmlExportOptions} from '@codeimage/dom-export';
import {EXPORT_EXCLUDE} from '../directives/exportExclude';
import type {Rasterizer} from './index';

export function domExport(output: 'blob' | 'dataUrl'): Rasterizer {
  return async (ref, {format, pixelRatio, quality}) => {
    const {toBlob, toJpeg, toSvg, toPng} =
      await import('@codeimage/dom-export');
    const toImageOptions: HtmlExportOptions = {
      type: format === 'svg' ? 'image/svg+xml' : `image/${format}`,
      filter: (node: Node | undefined) => {
        const isNotExcluded = () => {
          const el = node as Element | null;
          if (!el) return true;
          const attr = el?.getAttribute?.('data-export-exclude');
          return !attr || attr === 'false';
        };

        return (
          isNotExcluded() &&
          (!node?.hasOwnProperty(EXPORT_EXCLUDE) ||
            !(node as Node & {[EXPORT_EXCLUDE]: boolean})[EXPORT_EXCLUDE])
        );
      },
      pixelRatio: pixelRatio,
      quality: quality,
      experimental_optimizeFontLoading: true,
      experimental_safariResourceFix: true,
      experimental_includeExternalFonts: ['inter var'],
    };

    if (output === 'blob' && format === 'svg') {
      const svg = await toSvg(ref, toImageOptions);
      return new Blob([decodeURIComponent(svg.slice(svg.indexOf(',') + 1))], {
        type: 'image/svg+xml',
      });
    }
    if (output === 'blob') {
      const blob = await toBlob(ref, toImageOptions);
      if (!blob) throw new Error('Error on blob file save.');
      return blob;
    }

    const fn = {jpeg: toJpeg, png: toPng, svg: toSvg};
    return fn[format](ref, toImageOptions);
  };
}
