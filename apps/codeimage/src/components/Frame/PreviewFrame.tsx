import {getFrameState} from '@codeimage/store/editor/frame';
import {createFrameMedia} from './frameMedia';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import type {EditorState} from '@codeimage/store/editor/model';
import type {Language} from '@codemirror/language';
import {loadLanguage} from '@core/snapshot/tokenize';
import {dispatchCopyToClipboard} from '@codeimage/store/effects/onCopyToClipboard';
import {createRef} from '@core/helpers/create-ref';
import type {ParentProps, Ref, VoidProps} from 'solid-js';
import {createResource, onMount, Suspense} from 'solid-js';
import {Portal} from 'solid-js/web';
import {provideState} from 'statebuilder';
import {useHotkey} from '../../hooks/use-hotkey';
import * as styles from './Frame.css';
import {FrameSkeleton} from './FrameSkeleton';
import {FrameView} from './FrameView';

export interface PreviewFrameProps {
  ref: Ref<HTMLDivElement>;
  tab?: EditorState;
  language?: Language | null;
}

function PreviewPortal(props: ParentProps) {
  const config = provideState(EditorConfigStore);
  return (
    <Portal>
      <div
        data-dev-mode={config.get.devMode ? '' : undefined}
        class={styles.previewPortal}
      >
        <Suspense fallback={<FrameSkeleton />}>{props.children}</Suspense>
      </div>
    </Portal>
  );
}

export function PreviewFrame(props: VoidProps<PreviewFrameProps>) {
  const config = provideState(EditorConfigStore);
  let ref!: HTMLDivElement;
  const editor = getRootEditorStore();
  const tab = () => props.tab ?? getActiveEditorStore().editor();
  const [language] = createResource(
    () => {
      const active = tab();
      // Without a language id the canvas editor keeps its last parser, so the resource keeps it too.
      if (props.language !== undefined || !active?.languageId) return undefined;
      return {languageId: active.languageId, tabName: active.tab.tabName};
    },
    ({languageId, tabName}) => loadLanguage(languageId, tabName),
    {initialValue: null},
  );
  const filterHotKey = () =>
    editor.state.options.focused ||
    document.activeElement?.nodeName === 'INPUT';

  onMount(() => {
    useHotkey(document.body, {
      // eslint-disable-next-line solid/reactivity
      'Control+C': () => {
        if (filterHotKey()) return;
        if (!ref) return;
        dispatchCopyToClipboard({ref, renderer: config.get.renderer});
      },
    });
  });

  const media = createFrameMedia(() => getFrameState().store);
  const exportCanvas = getExportCanvasStore();
  return (
    <PreviewPortal>
      <FrameView
        ref={createRef<'div'>(props, el => (ref = el))}
        tab={props.tab}
        media={media()}
        language={
          props.language === undefined ? language.latest : props.language
        }
        showOnlyActiveTab={exportCanvas.get.showOnlyActiveTab}
      />
    </PreviewPortal>
  );
}
