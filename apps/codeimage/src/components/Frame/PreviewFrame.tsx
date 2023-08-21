import {getAssetsStore, isAssetUrl} from '@codeimage/store/assets/assets';
import {AssetsImage} from '@codeimage/store/assets/AssetsImage';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {dispatchCopyToClipboard} from '@codeimage/store/effects/onCopyToClipboard';
import {createRef} from '@core/helpers/create-ref';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {
  lazy,
  onMount,
  ParentProps,
  Ref,
  Show,
  Suspense,
  VoidProps,
} from 'solid-js';
import {Portal} from 'solid-js/web';
import {setPreviewEditorView} from '../../hooks/export-snippet';
import {useHotkey} from '../../hooks/use-hotkey';
import {DynamicTerminal} from '../Terminal/DynamicTerminal/DynamicTerminal';
import * as styles from './Frame.css';
import {FrameSkeleton} from './FrameSkeleton';

interface PreviewFrameProps {
  ref: Ref<HTMLDivElement>;
}

const PreviewExportEditor = lazy(
  () => import('../CustomEditor/PreviewExportEditor'),
);

function PreviewPortal(props: ParentProps) {
  return (
    <Portal>
      <div class={styles.previewPortal}>
        <Suspense fallback={<FrameSkeleton />}>{props.children}</Suspense>
      </div>
    </Portal>
  );
}

export function PreviewFrame(props: VoidProps<PreviewFrameProps>) {
  let ref!: HTMLDivElement;
  const frame = getFrameState().store;
  const terminal = getTerminalState().state;
  const editor = getRootEditorStore();
  const assetsStore = getAssetsStore();

  const filterHotKey = () =>
    editor.state.options.focused ||
    document.activeElement?.nodeName === 'INPUT';

  onMount(() => {
    useHotkey(document.body, {
      // eslint-disable-next-line solid/reactivity
      'Control+C': () => {
        if (filterHotKey()) return;
        if (!ref) return;
        dispatchCopyToClipboard({ref});
      },
    });
  });

  return (
    <PreviewPortal>
      <div
        class={styles.previewWrapper}
        ref={createRef<'div'>(props, el => (ref = el))}
      >
        <div
          class={styles.container}
          style={assignInlineVars({
            overflow: 'hidden',
            [styles.frameVars.radius]: `${frame.radius}px`,
            [styles.frameVars.width]: `${frame.width}px`,
            [styles.frameVars.height]: `${frame.height}px`,
            [styles.frameVars.padding]: `${frame.padding}px`,
          })}
        >
          <div
            class={styles.previewOverlay}
            style={assignInlineVars({
              [styles.frameVars.backgroundColor]: assetsStore.isAssetUrl(
                frame.background,
              )
                ? 'transparent'
                : frame.background ?? 'transparent',
              [styles.frameVars.opacity]: `${frame.opacity}%`,
              [styles.frameVars.visibility]: `${
                frame.visible ? 'visible' : 'hidden'
              }`,
            })}
          >
            <Show when={isAssetUrl(frame.background) && frame.background}>
              {assetId => (
                <AssetsImage
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    'object-fit': 'cover',
                  }}
                  assetId={assetId()}
                />
              )}
            </Show>
          </div>

          <DynamicTerminal
            type={terminal.type}
            readonlyTab={true}
            showTab={true}
            shadow={terminal.shadow}
            background={terminal.background}
            accentVisible={terminal.accentVisible}
            textColor={terminal.textColor}
            showHeader={terminal.showHeader}
            showGlassReflection={terminal.showGlassReflection}
            showWatermark={terminal.showWatermark}
            opacity={terminal.opacity}
            alternativeTheme={terminal.alternativeTheme}
            themeId={editor.state.options.themeId}
          >
            <Show when={getActiveEditorStore().editor()}>
              <PreviewExportEditor onSetEditorView={setPreviewEditorView} />
            </Show>
          </DynamicTerminal>
        </div>
      </div>
    </PreviewPortal>
  );
}
