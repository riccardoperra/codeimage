import type {LocaleKeys} from '@codeimage/locale';
import {useI18n} from '@codeimage/locale';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getFrameState} from '@codeimage/store/editor/frame';
import {batch} from 'solid-js';
import type {Component} from 'solid-js';
import {ExportExtension} from '../../../hooks/use-export-image';
import type {AppLocaleEntries} from '../../../i18n';
import type {IconProps} from './icons';
import {CameraIcon, PhotoIcon, VectorIcon} from './icons';

/**
 * What one export produces. An export without a choice uses the saved
 * settings; a choice lets one export differ without changing them.
 */
export interface ExportChoice {
  readonly extension: ExportExtension;
  readonly pixelRatio: number;
  /** JPEG quality in percent, as the export store keeps it. */
  readonly quality: number;
}

export interface ExportFormat {
  readonly extension: ExportExtension;
  /** The same in every language. */
  readonly name: string;
  readonly icon: Component<IconProps>;
  readonly description: LocaleKeys<AppLocaleEntries>;
  /** Takes a quality. */
  readonly lossy: boolean;
  /** A vector, sharp at any size. */
  readonly scalable: boolean;
}

/** Every format, in display order. A new format is one more entry. */
export const EXPORT_FORMATS: Readonly<Record<ExportExtension, ExportFormat>> = {
  [ExportExtension.png]: {
    extension: ExportExtension.png,
    name: 'PNG',
    icon: PhotoIcon,
    description: 'editor.pngHint',
    lossy: false,
    scalable: false,
  },
  [ExportExtension.jpeg]: {
    extension: ExportExtension.jpeg,
    name: 'JPEG',
    icon: CameraIcon,
    description: 'editor.jpegFormatHint',
    lossy: true,
    scalable: false,
  },
  [ExportExtension.svg]: {
    extension: ExportExtension.svg,
    name: 'SVG',
    icon: VectorIcon,
    description: 'editor.svgHint',
    lossy: false,
    scalable: true,
  },
};

export const exportFormats = Object.values(EXPORT_FORMATS);

export const EXPORT_SCALES = [1, 2, 3, 6] as const;

export const JPEG_QUALITY = {min: 70, max: 100, step: 2} as const;

export function savedExportChoice(): ExportChoice {
  const store = getExportCanvasStore();
  return {
    extension: store.get.extension,
    pixelRatio: store.get.devicePixelRatio,
    quality: store.get.jpegQuality,
  };
}

export function saveExportChoice(choice: ExportChoice) {
  const store = getExportCanvasStore();
  batch(() => {
    store.set('extension', choice.extension);
    store.set('devicePixelRatio', choice.pixelRatio);
    store.set('jpegQuality', choice.quality);
  });
}

export function sameExportChoice(a: ExportChoice, b: ExportChoice) {
  return (
    a.extension === b.extension &&
    a.pixelRatio === b.pixelRatio &&
    (!EXPORT_FORMATS[a.extension].lossy || a.quality === b.quality)
  );
}

/** The image's size in pixels at a scale, or the frame's export target. */
export function exportResolution(pixelRatio: number): string {
  const target = getFrameState().exportTarget();
  if (target) return target.resolution.join(' × ');
  const {width, height} = getExportCanvasStore().get.canvasSize;
  return `${Math.ceil(width) * pixelRatio} × ${Math.ceil(height) * pixelRatio}`;
}

/**
 * A choice in a few words, `PNG at 3x`, or `PNG · 3x` when short. The saved
 * settings without a choice.
 */
export function exportSummary(
  choice = savedExportChoice(),
  length: 'long' | 'short' = 'long',
): string {
  const [t] = useI18n<AppLocaleEntries>();
  const target = getFrameState().exportTarget();
  return t(length === 'long' ? 'editor.exportSummary' : 'editor.exportShort', {
    format: EXPORT_FORMATS[choice.extension].name,
    size: target ? target.resolution.join(' × ') : `${choice.pixelRatio}x`,
  });
}
