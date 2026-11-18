import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {useStore} from 'statebuilder';
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
  flush,
  createComponent,
  createSignal,
  getOwner,
  runWithOwner,
} from 'solid-js';
import type {Accessor} from 'solid-js';
import {mountOwnedView} from '@core/helpers/mount-owned-view';
import {redactTabCode} from '../../../components/CustomEditor/plugins/secrets';
import {PreviewFrame} from '../../../components/Frame/PreviewFrame';
import type {EditorPageState} from '../page-state';
import {showExportSuccessToast} from '../../../components/Toolbar/ExportSuccessToast';
import {deliverTabFiles, renderTabFiles} from '../../../hooks/export-tabs';
import {ExportMode, exportImage} from '../../../hooks/use-export-image';
import {
  createAnimationExporter,
  type AnimationExporter,
} from './export-animation-dialog';
import type {AppLocaleEntries} from '../../../i18n';
import type {ExportChoice} from './export-formats';
import {savedExportChoice} from './export-formats';

type ExportAction =
  | 'image'
  | 'eachTab'
  | 'share'
  | 'newTab'
  | 'copy'
  | 'animation'
  | 'animationStart';

/**
 * How a requested export ended. `started` is a clipboard copy, which runs on
 * after the call and reports only through a toast. `canceled` is a share sheet
 * the user closed. `needs-review` leaves the secrets dialog open for the user.
 */
export type ExportOutcome =
  | {readonly status: 'done'}
  | {readonly status: 'started'}
  | {readonly status: 'canceled'}
  | {readonly status: 'busy'}
  | {readonly status: 'not-ready'}
  | {readonly status: 'needs-review'; readonly secrets: number}
  | {readonly status: 'failed'};

/** An export waiting for the secrets review, with the choice it was asked with. */
interface PendingExport {
  readonly action: ExportAction;
  readonly choice: ExportChoice | undefined;
}

export interface Exporter {
  readonly animation: AnimationExporter;
  readonly exportAnimation: () => void;
  readonly startAnimation: () => void;
  readonly ready: Accessor<boolean>;
  /** True while an export runs. */
  readonly busy: Accessor<boolean>;
  /** The number of tabs of the snippet. */
  readonly tabs: Accessor<number>;
  /**
   * Exports the image on the canvas with the choice, or with the export
   * settings without one. The other image actions take a choice the same way.
   */
  readonly image: (choice?: ExportChoice) => Promise<ExportOutcome>;
  /** One image per tab, in a zip. */
  readonly eachTab: (choice?: ExportChoice) => Promise<ExportOutcome>;
  readonly share: (choice?: ExportChoice) => Promise<ExportOutcome>;
  readonly newTab: (choice?: ExportChoice) => Promise<ExportOutcome>;
  /** Copies a PNG at the choice's scale. */
  readonly copy: (choice?: ExportChoice) => Promise<ExportOutcome>;
  readonly canCopy: Accessor<boolean>;
  readonly canShare: Accessor<boolean>;
  /** A requested export waits here while the user reviews visible secrets. */
  readonly confirming: Accessor<boolean>;
  readonly confirmingAnimation: Accessor<boolean>;
  readonly confirm: () => void;
  readonly cancel: () => void;
  readonly copyAltText: () => void;
  readonly canCopyAltText: Accessor<boolean>;
  /** How many secrets the tabs show, which the export would carry. */
  readonly secrets: Accessor<number>;
  /** Hides every secret in every tab. */
  readonly redactSecrets: () => void;
  readonly canRedact: Accessor<boolean>;
}

/**
 * Uses production's renderer, with an explicit per-tab alternative instead
 * of its persisted `oneImagePerTab` toggle. Secrets are reviewed first.
 */
export function createExporter(
  ref: Accessor<HTMLElement | undefined>,
  pageState: Accessor<EditorPageState>,
): Exporter {
  const editable = () => pageState().editable;
  const ready = () => pageState().ready;
  const config = useStore(EditorConfigStore);
  const [t] = useI18n<AppLocaleEntries>();
  const editor = getRootEditorStore();
  const owner = getOwner();
  const animation = createAnimationExporter();
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
      const dispose = mountOwnedView(owner, document.createElement('div'), () =>
        createComponent(PreviewFrame, {
          tab,
          language,
          ref: el => (frame = el),
        }),
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

  const run = async (
    action: ExportAction,
    choice: ExportChoice,
  ): Promise<ExportOutcome> => {
    if (!ready()) return {status: 'not-ready'};
    if (busy() || dispatchCopyToClipboard.loading()) return {status: 'busy'};
    if (action === 'animation') {
      animation.show();
      return {status: 'started'};
    }
    if (action === 'animationStart') {
      animation.start();
      return {status: 'started'};
    }
    if (action === 'copy') {
      const element = ref();
      if (!element) return {status: 'not-ready'};
      dispatchCopyToClipboard({
        ref: element,
        renderer: config.get.renderer,
        pixelRatio: choice.pixelRatio,
      });
      return {status: 'started'};
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
      if (!result) return {status: 'canceled'};
      if (mode !== ExportMode.newTab) {
        runWithOwner(owner, () =>
          showExportSuccessToast('altText.exported', text),
        );
      }
      return {status: 'done'};
    } catch {
      showError();
      return {status: 'failed'};
    } finally {
      setBusy(false);
    }
  };

  const request = async (
    action: ExportAction,
    choice?: ExportChoice,
  ): Promise<ExportOutcome> => {
    if (!ready()) return {status: 'not-ready'};
    if (busy() || pending() || dispatchCopyToClipboard.loading())
      return {status: 'busy'};
    const count = secrets();
    if (count > 0) {
      setPending({action, choice});
      return {status: 'needs-review', secrets: count};
    }
    return run(action, choice ?? savedExportChoice());
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
      () => {
        getWhatsNew().seen('alt');
        toast.success(() => t('altText.copied'));
      },
      () => toast.error(() => t('altText.copyError')),
    );
  };

  return {
    animation,
    exportAnimation: () => request('animation'),
    startAnimation: () => request('animationStart'),
    ready,
    busy: () => !ready() || busy() || dispatchCopyToClipboard.loading(),
    tabs: () => editor.state.editors.length,
    image: choice => request('image', choice),
    eachTab: choice => request('eachTab', choice),
    share: choice => request('share', choice),
    newTab: choice => request('newTab', choice),
    copy: choice => request('copy', choice),
    canCopy: () => ready() && !!navigator.clipboard?.write,
    canShare: () => !!navigator.share,
    confirming: () => pending() !== undefined,
    confirmingAnimation: () =>
      pending()?.action === 'animation' ||
      pending()?.action === 'animationStart',
    confirm,
    cancel: () => setPending(undefined),
    copyAltText,
    canCopyAltText: () =>
      ready() &&
      !!getActiveEditorStore().editor() &&
      !!navigator.clipboard?.writeText,
    secrets,
    canRedact: editable,
    redactSecrets: () => {
      if (!editable()) return;
      getWhatsNew().seen('redact');
      flush(() => {
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
