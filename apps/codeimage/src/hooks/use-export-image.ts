import {getFrameState} from '@codeimage/store/editor/frame';
import {type HtmlExportOptions} from '@codeimage/dom-export';
import {EXPORT_EXCLUDE} from '@core/directives/exportExclude';
import {useWebshare} from '@core/hooks/use-webshare';
import {isIOS} from '@solid-primitives/platform';
import download from 'downloadjs';

function loadDomExport() {
  return import('@codeimage/dom-export');
}

export const enum ExportMode {
  export = 'export',
  share = 'share',
  newTab = 'newTab',
  getBlob = 'getBlob',
}

export const enum ExportExtension {
  svg = 'svg',
  png = 'png',
  jpeg = 'jpeg',
}

export interface ExportOptions {
  extension: ExportExtension;
  mode: ExportMode;
  pixelRatio: number;
  quality: number;
}

export interface ExportImagePayload {
  ref: HTMLElement | null | undefined;
  options: ExportOptions;
}

function resolveMimeType(extension: ExportExtension): string {
  switch (extension) {
    case ExportExtension.jpeg:
      return `image/jpeg`;
    case ExportExtension.png:
      return `image/png`;
    case ExportExtension.svg:
      return `image/svg+xml`;
  }
}

export async function exportImage(
  data: ExportImagePayload,
): Promise<Blob | string | undefined> {
  const {
    options: {extension, mode, pixelRatio, quality},
    ref,
  } = data;

  const [supported, canShare, share] = useWebshare();

  if (!ref) {
    throw new Error('Reference is not defined.');
  }

  const resolvedFileName = `codeimage-snippet_${new Date().getUTCDate()}`;
  const mimeType = resolveMimeType(extension);
  const fileNameWithExtension = `${resolvedFileName}.${extension}`;
  const previewNode = ref.firstChild as HTMLElement;

  const toImageOptions: HtmlExportOptions = {
    type: mimeType,
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
    pixelRatio: getFrameState().exportPixelRatio(pixelRatio),
    quality: quality,
    experimental_optimizeFontLoading: true,
    experimental_safariResourceFix: true,
    experimental_includeExternalFonts: ['inter var'],
  };

  async function exportByMode(ref: HTMLElement) {
    const {toBlob, toJpeg, toSvg, toPng} = await loadDomExport();

    switch (mode) {
      case 'share': {
        if (!supported()) {
          throw new Error('WebShare api is not supported.');
        }

        const blob = await toBlob(ref, toImageOptions);

        if (!blob) {
          throw new Error('Error on blob file save.');
        }

        const file = new File([blob], fileNameWithExtension, {
          type: mimeType,
        });

        const data = {
          title: 'Created with CodeImage',
          files: [file],
        };

        if (!canShare(data)) {
          throw new Error('WebShare cannot share this image.');
        }

        const shared = share(data)?.then(
          () => true,
          (error: unknown) => {
            if (error instanceof Error && error.name === 'AbortError') {
              return false;
            }
            throw error;
          },
        );
        // iOS "Save image" can leave share() pending. Release the loading state
        // after three seconds, without claiming that the share succeeded.
        const completed = isIOS
          ? await Promise.race([
              shared,
              new Promise<false>(resolve =>
                setTimeout(() => resolve(false), 3000),
              ),
            ])
          : await shared;
        if (!completed) return undefined;

        return blob;
      }
      case 'export': {
        const fn = {
          [ExportExtension.jpeg]: toJpeg,
          [ExportExtension.png]: toPng,
          [ExportExtension.svg]: toSvg,
        } as const;

        const result = await fn[extension](ref, toImageOptions);
        download(result, fileNameWithExtension);

        return result;
      }
      case ExportMode.newTab: {
        const link = document.createElement('a');
        return toBlob(ref, toImageOptions)
          .then(blob => {
            return [blob, window.URL.createObjectURL(blob as Blob)] as [
              Blob,
              string,
            ];
          })
          .then(([blob, url]) => {
            if (!isIOS) {
              link.target = '_blank';
            }
            link.href = url;
            document.body.appendChild(link);
            link.click();
            link.remove();
            return blob as Blob;
          });
      }
      case ExportMode.getBlob: {
        const blob = await toBlob(ref, toImageOptions);
        return blob as Blob;
      }
      default: {
        throw new Error('Invalid modality');
      }
    }
  }

  return exportByMode(previewNode);
}
