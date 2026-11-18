import {getFrameState} from '@codeimage/store/editor/frame';
import {createFrameMedia} from './frameMedia';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import type {EditorState} from '@codeimage/store/editor/model';
import type {Language} from '@codemirror/language';
import {loadLanguage} from '@core/snapshot/tokenize';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import type {ParentProps, Ref, VoidProps} from 'solid-js';
import {createMemo, Show, Loading} from 'solid-js';
import {createResource} from '@codeimage/store/plugins/create-resource';
import {Portal} from '@solidjs/web';
import {useStore} from 'statebuilder';
import * as styles from './Frame.css';
import {FrameSkeleton} from './FrameSkeleton';
import {FrameView} from './FrameView';

export interface PreviewFrameProps {
  ref: Ref<HTMLDivElement>;
  tab?: EditorState;
  language?: Language | null;
}

function PreviewPortal(props: ParentProps) {
  const config = useStore(EditorConfigStore);
  return (
    <Portal>
      <div
        data-dev-mode={config.get.devMode ? '' : undefined}
        class={styles.previewPortal}
      >
        <Loading fallback={<FrameSkeleton />}>{props.children}</Loading>
      </div>
    </Portal>
  );
}

// The terminal theme and code font that every static or animated view of the
// frame draws with.
export function useFrameCodeStyle() {
  const editor = getRootEditorStore();
  const {getThemeResource, themeArray} = getThemeStore();
  const theme = createMemo(
    () =>
      getThemeResource(editor.state.options.themeId)?.[0]() ??
      themeArray()[0]?.(),
  );
  return {
    theme,
    fontFamily: () => editor.computed.selectedFont().name,
    fontWeight: () => editor.state.options.fontWeight,
    enableLigatures: () => editor.state.options.enableLigatures,
    showLineNumbers: () => editor.state.options.showLineNumbers,
  };
}

export function PreviewFrame(props: VoidProps<PreviewFrameProps>) {
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
  const {theme} = useFrameCodeStyle();
  const media = createFrameMedia(() => getFrameState().store);
  const exportCanvas = getExportCanvasStore();
  return (
    <PreviewPortal>
      <Show when={theme()}>
        {theme => (
          <FrameView
            ref={props.ref}
            tab={props.tab}
            theme={theme()}
            media={media()}
            language={
              props.language === undefined ? language.latest : props.language
            }
            showOnlyActiveTab={exportCanvas.get.showOnlyActiveTab}
          />
        )}
      </Show>
    </PreviewPortal>
  );
}
