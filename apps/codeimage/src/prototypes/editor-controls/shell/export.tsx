import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {provideState} from 'statebuilder';
import {useI18n} from '@codeimage/locale';
import {detectSecrets} from '@codeimage/secrets';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getRootEditorStore} from '@codeimage/store/editor';
import {toast} from '@codeimage/ui';
import {getUmami} from '@core/constants/umami';
import {loadLanguage} from '@core/snapshot/tokenize';
import type {Accessor} from 'solid-js';
import {batch, createComponent, createSignal, getOwner} from 'solid-js';
import {render} from 'solid-js/web';
import {redactTabCode} from '../../../components/CustomEditor/plugins/secrets';
import {PreviewFrame} from '../../../components/Frame/PreviewFrame';
import {deliverTabFiles, renderTabFiles} from '../../../hooks/export-tabs';
import {ExportMode, exportImage} from '../../../hooks/use-export-image';
import type {AppLocaleEntries} from '../../../i18n';

export interface Exporter {
  /** True while an export runs. */
  readonly busy: Accessor<boolean>;
  /** The number of tabs of the snippet. */
  readonly tabs: Accessor<number>;
  /** Exports the image on the canvas with the export settings. */
  readonly image: () => void;
  /** Exports one image per tab with the export settings, in a zip. */
  readonly eachTab: () => void;
  /** How many secrets the tabs show, which the export would carry. */
  readonly secrets: Accessor<number>;
  /** Hides every secret in every tab. */
  readonly redactSecrets: () => void;
}

/**
 * Exports at once with the settings of the production export store: no
 * dialog in between. The image is production's `exportImage`. One image per
 * tab mirrors production's `useExportSnippet`, which picks it from the
 * stored `oneImagePerTab` flag and does not export its own path: the same
 * `PreviewFrame` per tab, the same files and the same zip, on demand.
 */
export function createExporter(
  ref: Accessor<HTMLElement | undefined>,
): Exporter {
  const config = provideState(EditorConfigStore);
  const canvas = getExportCanvasStore();
  const editor = getRootEditorStore();
  const owner = getOwner();
  const [busy, setBusy] = createSignal(false);

  const options = (mode: ExportMode) => ({
    extension: canvas.get.extension,
    mode,
    pixelRatio: canvas.get.devicePixelRatio,
    quality: canvas.get.jpegQuality / 100,
  });

  const run = async (task: () => Promise<unknown>) => {
    if (busy()) return;
    setBusy(true);
    getUmami().track('export-confirm', {
      mode: ExportMode.export,
      extension: canvas.get.extension,
    });
    try {
      await task();
    } catch {
      toast.error(
        () => {
          const [t] = useI18n<AppLocaleEntries>();
          return <>{t('export.genericSaveError')}</>;
        },
        {position: 'bottom-center'},
      );
    } finally {
      setBusy(false);
    }
  };

  const eachTab = async () => {
    const payload = options(ExportMode.export);
    const renderer = config.get.renderer;
    const tabs = editor.state.editors.map(tab => ({
      ...tab,
      tab: {...tab.tab},
      name: tab.tab.tabName,
    }));
    const files = await renderTabFiles(tabs, async tab => {
      const language = await loadLanguage(tab.languageId, tab.tab.tabName);
      let frame: HTMLDivElement | undefined;
      const dispose = render(
        () =>
          createComponent(PreviewFrame, {
            tab,
            language,
            ref: el => (frame = el),
          }),
        document.createElement('div'),
        undefined,
        {owner},
      );
      try {
        return await exportImage({
          ref: frame,
          renderer,
          options: {...payload, mode: ExportMode.getBlob},
        });
      } finally {
        dispose();
      }
    });
    return deliverTabFiles(files, payload.mode);
  };

  return {
    busy,
    tabs: () => editor.state.editors.length,
    image: () =>
      void run(() =>
        exportImage({
          ref: ref(),
          renderer: config.get.renderer,
          options: options(ExportMode.export),
        }),
      ),
    eachTab: () => void run(eachTab),
    secrets: () =>
      editor.state.editors.reduce(
        (count, tab) => count + detectSecrets(tab.code).length,
        0,
      ),
    redactSecrets: () =>
      batch(() => {
        editor.state.editors.forEach((tab, index) => {
          const redacted = redactTabCode(
            tab.code,
            editor.isActive(tab.id) ? editor.activeEditorView() : undefined,
          );
          if (redacted !== tab.code)
            editor.actions.setEditors(index, 'code', redacted);
        });
      }),
  };
}
