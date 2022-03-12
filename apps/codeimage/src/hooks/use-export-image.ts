import {useAsyncAction} from '../core/hooks/async-action';
import {toBlob, toJpeg, toPng, toSvg} from 'html-to-image';
import {EXPORT_EXCLUDE} from '../core/directives/exportExclude';
import download from 'downloadjs';
import {Resource} from 'solid-js';

export const enum ExportMode {
  export = 'export',
  share = 'share',
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
    options: {extension, fileName, mode},
    ref,
  } = data;

  if (!ref) {
    throw new Error('Reference is not defined.');
  }

  const resolvedFileName = fileName || `codeImage_${new Date().getUTCDate()}`;
  const mimeType = resolveMimeType(extension);
  const fileNameWithExtension = `${resolvedFileName}.${extension}`;

  const toImageOptions = {
    filter: (node: Node) => !node.hasOwnProperty(EXPORT_EXCLUDE),
    style: {
      // TODO: https://github.com/riccardoperra/codeimage/issues/42
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      zoom: '1',
      transform: 'scale(1)',
    },
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
        await navigator.share(data);
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
    // @ts-expect-error: The modality must have a value
    default: {
      throw new Error('Invalid modality');
    }
  }
}
