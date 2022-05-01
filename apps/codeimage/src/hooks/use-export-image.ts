import {useAsyncAction} from '../core/hooks/async-action';
import {toBlob, toJpeg, toPng, toSvg} from 'html-to-image';
import {EXPORT_EXCLUDE} from '../core/directives/exportExclude';
import download from 'downloadjs';
import {Resource} from 'solid-js';
import {Options as HtmlToImageExportOptions} from 'html-to-image/es/options';
import {IS_IOS} from '../core/constants/browser';

export const enum ExportMode {
  export = 'export',
  share = 'share',
  newTab = 'newTab',
}

export const enum ExportExtension {
  svg = 'svg',
  png = 'png',
  jpeg = 'jpeg',
}

interface ExportOptions {
  extension: ExportExtension;
  mode: ExportMode;
  fileName?: string;
  pixelRatio: number;
  quality: number;
}

interface ExportImagePayload {
  ref: HTMLElement | null | undefined;
  options: ExportOptions;
}

export function useExportImage(): [
  Resource<Blob | string | undefined>,
  (data: ExportImagePayload) => void,
] {
  const [data, {notify}] = useAsyncAction(async (ref: ExportImagePayload) => {
    // @bad Find another way to prevent flickering
    await new Promise(r => setTimeout(r, 150));
    return exportImage(ref);
  });

  return [data, notify];
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

async function exportImage(data: ExportImagePayload): Promise<Blob | string> {
  const {
    options: {extension, fileName, mode, pixelRatio, quality},
    ref,
  } = data;

  if (!ref) {
    throw new Error('Reference is not defined.');
  }

  const resolvedFileName = fileName || `codeImage_${new Date().getUTCDate()}`;
  const mimeType = resolveMimeType(extension);
  const fileNameWithExtension = `${resolvedFileName}.${extension}`;

  const toImageOptions: HtmlToImageExportOptions = {
    filter: (node: Node) => {
      return (
        !node.hasOwnProperty(EXPORT_EXCLUDE) ||
        !(node as Node & {[EXPORT_EXCLUDE]: boolean})[EXPORT_EXCLUDE]
      );
    },
    style: {
      // TODO: https://github.com/riccardoperra/codeimage/issues/42
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      zoom: '1',
      transform: 'scale(1)',
      // TODO: https://github.com/riccardoperra/codeimage/issues/203
      // clean up style side effects
      margin: '0',
      padding: '0',
    },
    pixelRatio: pixelRatio,
    quality: quality,
  };

  switch (mode) {
    case 'share': {
      if (!navigator.share) {
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

      if (navigator.canShare(data)) {
        const share = () =>
          navigator.share(data).catch((error: Error) => {
            if (error.name === 'AbortError') {
              return null;
            }
            throw error;
          });

        /**
         * ATTENTION: this is a partial workaround to fix this issue of "Save image" for iOS 15:
         * {@link https://bugs.webkit.org/show_bug.cgi?id=231995}
         *
         * The Promise.race() allows to update the pending state of the promise
         * after 3s since the share() will never be resolved if the
         * user press on "Save image" button.
         *
         * This fix is partial since if the promise of navigator.share() is not resolved,
         * even if the pending is present, an error by the platform/userAgent of iOS will be thrown
         *
         * */
        if (IS_IOS) {
          await Promise.race([share(), new Promise(r => setTimeout(r, 3000))]);
          return blob;
        } else {
          await share();
        }
      }

      return blob;
    }
    case 'export': {
      const fn = {
        [ExportExtension.jpeg]: toJpeg,
        [ExportExtension.png]: toPng,
        [ExportExtension.svg]: toSvg,
      };

      const result = await fn[extension](ref, toImageOptions);
      download(result, fileNameWithExtension);

      return result;
    }
    case ExportMode.newTab: {
      const blob = await toBlob(ref, toImageOptions);
      if (blob) {
        const url = URL.createObjectURL(blob);
        window.open(url);
      }
      return blob as Blob;
    }
    default: {
      throw new Error('Invalid modality');
    }
  }
}
