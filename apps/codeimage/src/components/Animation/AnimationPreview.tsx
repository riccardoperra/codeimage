import {AnimationStage} from './AnimationStage';
import {AnimateModeBadge} from './AnimateModeBadge';
import {projectStep} from '@core/animation/project';
import {Portal} from 'solid-js/web';
import {useI18n} from '@codeimage/locale';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {toast} from '@codeimage/ui';
import type {ParentProps} from 'solid-js';
import {
  createEffect,
  createMemo,
  createSignal,
  getOwner,
  on,
  Show,
} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {useFrameCodeStyle} from '../Frame/PreviewFrame';
import * as styles from './AnimationPreview.css';
import {PreviewPill} from './PreviewPill';
import {
  createPreviewSnapshot,
  type PreviewRequest,
} from './createPreviewSnapshot';
import {
  type CodeStyle,
  measurePreview,
  planPreviewTimeline,
  type PreviewPlan,
  type PreviewTab,
} from './planPreview';

// Shows the editor frame, or the animation in its place once a preview has
// planned it.
export function AnimationPreview(
  props: ParentProps<{pillHost: HTMLElement | undefined}>,
) {
  const {animation, editor} = getEditorStore();
  const frame = getFrameState();
  const terminal = getTerminalState();
  const exportCanvas = getExportCanvasStore();
  const style = useFrameCodeStyle();
  const owner = getOwner();
  const [t] = useI18n<AppLocaleEntries>();
  const previewing = () => animation.playback().state !== 'editing';
  // Part of the plan's key, so a plan that failed is made again.
  const [failures, setFailures] = createSignal(0);

  // Reads the tabs only while previewing, so typing plans nothing. Equal
  // inputs keep the last plan, and closing the panel drops it.
  const request = createMemo<PreviewRequest | undefined>(previous => {
    if (!animation.open()) return undefined;
    if (!previewing()) return previous;
    const settings = animation.settings();
    const [first, ...rest] = settings.steps.map((step): PreviewTab => {
      const tab = editor.state.editors.find(({id}) => id === step.editorId)!;
      return {
        id: tab.id,
        ...projectStep({code: tab.code, marks: tab.marks}, step.view),
        languageId: tab.languageId,
        lineNumberStart: tab.lineNumberStart,
        tabName: tab.tab.tabName,
      };
    });
    const codeStyle: CodeStyle = {
      theme: style.theme()!,
      fontFamily: style.fontFamily(),
      fontWeight: style.fontWeight(),
      enableLigatures: style.enableLigatures(),
      showLineNumbers: style.showLineNumbers(),
    };
    const key = JSON.stringify({
      failures: failures(),
      header: settings.header,
      tabs: [first, ...rest],
      style: {...codeStyle, theme: codeStyle.theme.id},
      tabNames: editor.state.editors.map(tab => tab.tab.tabName),
      frame: frame.stateToPersist(),
      target: frame.exportTarget()?.id,
      terminal: terminal.state,
      showOnlyActiveTab: exportCanvas.get.showOnlyActiveTab,
    });
    const scope = JSON.stringify({
      tabNames: editor.state.editors.map(tab => tab.tab.tabName),
      frame: frame.stateToPersist(),
      target: frame.exportTarget()?.id,
      terminal: terminal.state,
      showOnlyActiveTab: exportCanvas.get.showOnlyActiveTab,
    });
    return {settings, tabs: [first, ...rest], style: codeStyle, key, scope};
  });
  const {measurement, snapshot} = createPreviewSnapshot(
    () => request(),
    ({settings, tabs, style, scope}) =>
      measurePreview(owner, tabs, style, settings.header, undefined, scope),
  );
  const planned = createMemo<PreviewPlan | undefined>(previous => {
    const current = snapshot();
    return current
      ? planPreviewTimeline(current.settings, current.measured)
      : request()
        ? previous
        : undefined;
  });
  const ready = () => previewing() && planned() !== undefined;
  const [focusPreview, setFocusPreview] = createSignal(false);
  createEffect(
    on(() => animation.playback().state === 'playing', setFocusPreview),
  );
  const focused = () => setFocusPreview(false);

  createEffect(
    on(
      () => measurement.state === 'errored',
      errored => {
        if (!errored) return;
        console.error(measurement.error);
        toast.error(t('animation.previewFailed'));
        animation.actions.edit();
        setFailures(count => count + 1);
      },
    ),
  );

  // The editor frame keeps its layout under the stage. Its size is measured
  // into the frame store, which sizes the export frame. Opacity hides it,
  // since its background sets its own visibility.
  return (
    <div class={styles.layers}>
      <div
        class={styles.layer}
        inert={ready() || undefined}
        style={{opacity: ready() ? 0 : undefined}}
      >
        {props.children}
      </div>
      <Show when={animation.open() && props.pillHost} keyed>
        {host => (
          <Portal mount={host}>
            <AnimateModeBadge />
          </Portal>
        )}
      </Show>
      <Show when={ready() && props.pillHost} keyed>
        {host => (
          <Portal mount={host}>
            <PreviewPill />
          </Portal>
        )}
      </Show>
      <AnimationStage
        plan={planned()}
        visible={ready()}
        focus={focusPreview()}
        onFocused={focused}
      />
    </div>
  );
}
