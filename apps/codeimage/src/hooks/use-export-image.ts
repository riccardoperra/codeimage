import type {RasterizerName, RasterizeOptions} from '@core/rasterize';
import {useWebshare} from '@core/hooks/use-webshare';
import {isIOS} from '@solid-primitives/platform';
import download from 'downloadjs';

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
  renderer: RasterizerName;
  rasterizeOptions?: Partial<Pick<RasterizeOptions, 'pixelRatio'>>;
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

  const [{createRasterizer}, {getRootEditorStore}, {getFrameState}] =
    await Promise.all([
      import('@core/rasterize'),
      import('../state/editor'),
      import('@codeimage/store/editor/frame'),
    ]);
  const rasterize = createRasterizer(
    data.renderer,
    mode === ExportMode.export ? 'dataUrl' : 'blob',
  );
  const rasterizeOptions = {
    codeFont: getRootEditorStore().computed.selectedFont(),
    format: extension,
    pixelRatio: getFrameState().exportPixelRatio(
      data.rasterizeOptions?.pixelRatio ?? pixelRatio,
    ),
    quality,
  };

  async function getBlob(node: HTMLElement) {
    const result = await rasterize(node, rasterizeOptions);
    if (!(result instanceof Blob)) throw new Error('Error on blob file save.');
    return result;
  }

  async function exportByMode(ref: HTMLElement) {
    switch (mode) {
      case 'share': {
        if (!supported()) {
          throw new Error('WebShare api is not supported.');
        }

        const blob = await getBlob(ref);

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
        const result = await rasterize(ref, rasterizeOptions);
        download(result, fileNameWithExtension);

        return result;
      }
      case ExportMode.newTab: {
        const link = document.createElement('a');
        return getBlob(ref)
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
        const blob = await getBlob(ref);
        return blob as Blob;
      }
      default: {
        throw new Error('Invalid modality');
      }
    }
  }

  return exportByMode(previewNode);
}
