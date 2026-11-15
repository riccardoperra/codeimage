import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {provideState} from 'statebuilder';
import {useI18n} from '@codeimage/locale';
import {detectSecrets} from '@codeimage/secrets';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getWhatsNew} from '@codeimage/store/whats-new';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {dispatchCopyToClipboard} from '@codeimage/store/effects/onCopyToClipboard';
import {toast} from '@codeimage/ui';
import {altText} from '@core/altText';
import {getUmami} from '@core/constants/umami';
import {loadLanguage} from '@core/snapshot/tokenize';
import {
  batch,
  createComponent,
  createSignal,
  getOwner,
  runWithOwner,
} from 'solid-js';
import type {Accessor} from 'solid-js';
import {render} from 'solid-js/web';
import {redactTabCode} from '../../../components/CustomEditor/plugins/secrets';
import {PreviewFrame} from '../../../components/Frame/PreviewFrame';
import {showExportSuccessToast} from '../../../components/Toolbar/ExportSuccessToast';
import {deliverTabFiles, renderTabFiles} from '../../../hooks/export-tabs';
import {ExportMode, exportImage} from '../../../hooks/use-export-image';
import type {AppLocaleEntries} from '../../../i18n';
import type {ExportChoice} from './export-formats';
import {savedExportChoice} from './export-formats';

type ExportAction = 'image' | 'eachTab' | 'share' | 'newTab' | 'copy';

/** An export waiting for the secrets review, with the choice it was asked with. */
interface PendingExport {
  readonly action: ExportAction;
  readonly choice: ExportChoice | undefined;
}

export interface Exporter {
  /** True while an export runs. */
  readonly busy: Accessor<boolean>;
  /** The number of tabs of the snippet. */
  readonly tabs: Accessor<number>;
  /**
   * Exports the image on the canvas with the choice, or with the export
   * settings without one. The other image actions take a choice the same way.
   */
  readonly image: (choice?: ExportChoice) => void;
  /** One image per tab, in a zip. */
  readonly eachTab: (choice?: ExportChoice) => void;
  readonly share: (choice?: ExportChoice) => void;
  readonly newTab: (choice?: ExportChoice) => void;
  /** Copies a PNG at the choice's scale. */
  readonly copy: (choice?: ExportChoice) => void;
  readonly canCopy: Accessor<boolean>;
  readonly canShare: Accessor<boolean>;
  /** A requested export waits here while the user reviews visible secrets. */
  readonly confirming: Accessor<boolean>;
  readonly confirm: () => void;
  readonly cancel: () => void;
  readonly copyAltText: () => void;
  readonly canCopyAltText: Accessor<boolean>;
  /** How many secrets the tabs show, which the export would carry. */
  readonly secrets: Accessor<number>;
  /** Hides every secret in every tab. */
  readonly redactSecrets: () => void;
}

/**
 * Uses production's renderer, with an explicit per-tab alternative instead
 * of its persisted `oneImagePerTab` toggle. Secrets are reviewed first.
 */
export function createExporter(
  ref: Accessor<HTMLElement | undefined>,
): Exporter {
  const config = provideState(EditorConfigStore);
  const [t] = useI18n<AppLocaleEntries>();
  const editor = getRootEditorStore();
  const owner = getOwner();
  const [busy, setBusy] = createSignal(false);
  const [pending, setPending] = createSignal<PendingExport>();
  const secrets = () =>
    editor.state.editors.reduce(
      (count, tab) => count + detectSecrets(tab.code).length,
      0,
    );

  const options = (mode: ExportMode, choice: ExportChoice) => ({
    extension: choice.extension,
    mode,
    pixelRatio: choice.pixelRatio,
    quality: choice.quality / 100,
  });

  const eachTab = async (choice: ExportChoice) => {
    const payload = options(ExportMode.export, choice);
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

  const showError = () =>
    runWithOwner(owner, () =>
      toast.error(() => t('export.genericSaveError'), {
        position: 'bottom-center',
      }),
    );

  const run = async (action: ExportAction, choice: ExportChoice) => {
    if (busy() || dispatchCopyToClipboard.loading()) return;
    if (action === 'copy') {
      const element = ref();
      if (element)
        dispatchCopyToClipboard({
          ref: element,
          renderer: config.get.renderer,
          pixelRatio: choice.pixelRatio,
        });
      return;
    }
    setBusy(true);
    if (action === 'eachTab') getWhatsNew().seen('tabs');
    const mode =
      action === 'share'
        ? ExportMode.share
        : action === 'newTab'
          ? ExportMode.newTab
          : ExportMode.export;
    const activeEditor = getActiveEditorStore().editor();
    const text = activeEditor && altText(activeEditor);
    if (mode === ExportMode.newTab) getUmami().track('export-new-tab');
    else
      getUmami().track('export-confirm', {
        mode,
        extension: choice.extension,
      });
    try {
      const result = await (action === 'eachTab'
        ? eachTab(choice)
        : runWithOwner(owner, () =>
            exportImage({
              ref: ref(),
              renderer: config.get.renderer,
              options: options(mode, choice),
            }),
          ));
      if (result && mode !== ExportMode.newTab) {
        runWithOwner(owner, () =>
          showExportSuccessToast('altText.exported', text),
        );
      }
    } catch {
      showError();
    } finally {
      setBusy(false);
    }
  };

  const request = (action: ExportAction, choice?: ExportChoice) => {
    if (busy() || pending() || dispatchCopyToClipboard.loading()) return;
    if (secrets() > 0) setPending({action, choice});
    else void run(action, choice ?? savedExportChoice());
  };

  const confirm = () => {
    const request = pending();
    setPending(undefined);
    // Let the export preview catch up with redaction before capturing it.
    if (request)
      requestAnimationFrame(
        () => void run(request.action, request.choice ?? savedExportChoice()),
      );
  };

  const copyAltText = () => {
    const activeEditor = getActiveEditorStore().editor();
    if (!activeEditor || !navigator.clipboard?.writeText) return;
    const text = altText(activeEditor);
    navigator.clipboard.writeText(text).then(
      () => toast.success(() => t('altText.copied')),
      () => toast.error(() => t('altText.copyError')),
    );
  };

  return {
    busy: () => busy() || dispatchCopyToClipboard.loading(),
    tabs: () => editor.state.editors.length,
    image: choice => request('image', choice),
    eachTab: choice => request('eachTab', choice),
    share: choice => request('share', choice),
    newTab: choice => request('newTab', choice),
    copy: choice => request('copy', choice),
    canCopy: () => !!navigator.clipboard?.write,
    canShare: () => !!navigator.share,
    confirming: () => pending() !== undefined,
    confirm,
    cancel: () => setPending(undefined),
    copyAltText,
    canCopyAltText: () =>
      !!getActiveEditorStore().editor() && !!navigator.clipboard?.writeText,
    secrets,
    redactSecrets: () => {
      getWhatsNew().seen('redact');
      batch(() => {
        editor.state.editors.forEach((tab, index) => {
          const redacted = redactTabCode(
            tab.code,
            editor.isActive(tab.id) ? editor.activeEditorView() : undefined,
          );
          if (redacted !== tab.code)
            editor.actions.setEditors(index, 'code', redacted);
        });
      });
    },
  };
}
