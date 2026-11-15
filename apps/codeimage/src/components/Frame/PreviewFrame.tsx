import {FittedWindow} from './FittedWindow';
import {FrameSignature, framePadding, signatureScale} from './FrameSignature';
import {getAssetsStore, isAssetUrl} from '@codeimage/store/assets/assets';
import {AssetsImage} from '@codeimage/store/assets/AssetsImage';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {getFrameState} from '@codeimage/store/editor/frame';
import type {EditorState} from '@codeimage/store/editor/model';
import type {Language} from '@codemirror/language';
import {loadLanguage} from '@core/snapshot/tokenize';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {dispatchCopyToClipboard} from '@codeimage/store/effects/onCopyToClipboard';
import {createRef} from '@core/helpers/create-ref';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import type {ParentProps, Ref, VoidProps} from 'solid-js';
import {
  createEffect,
  createMemo,
  createResource,
  on,
  onMount,
  Show,
  Suspense,
} from 'solid-js';
import {Portal} from 'solid-js/web';
import {provideState} from 'statebuilder';
import {isKeyOwnedByFocus, useHotkey} from '../../hooks/use-hotkey';
import {DynamicTerminal} from '../Terminal/DynamicTerminal/DynamicTerminal';
import StaticCodeView from '../CustomEditor/StaticCodeView';
import {
  bindWatermarkExport,
  createWatermarkScope,
} from '../../core/watermark/scope';
import * as styles from './Frame.css';
import {FrameSkeleton} from './FrameSkeleton';

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
  const frame = getFrameState().store;
  const target = () => getFrameState().exportTarget();
  const scale = () => signatureScale(target()?.resolution[0] ?? frame.width);
  const terminal = getTerminalState().state;
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
  const assetsStore = getAssetsStore();
  const watermark = createWatermarkScope();
  createEffect(on(() => frame.signature?.position, watermark.invalidate));
  const exportCanvasStore = getExportCanvasStore();
  const theme = createMemo(() => {
    const themes = getThemeStore().themeArray();
    return (
      themes.find(theme => theme()?.id === editor.state.options.themeId)?.() ??
      themes[0]()
    );
  });

  const filterHotKey = () =>
    editor.state.options.focused || isKeyOwnedByFocus();

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

  return (
    <PreviewPortal>
      <div
        class={styles.previewWrapper}
        ref={createRef<'div'>(props, el => {
          ref = el;
          bindWatermarkExport(el, watermark);
        })}
      >
        <div
          class={styles.container}
          ref={element => watermark.attach('frame', element)}
          data-watermark-frame
          style={assignInlineVars({
            overflow: 'hidden',
            [styles.frameVars.radius]: `${frame.radius}px`,
            [styles.frameVars.width]: target()
              ? `${target()!.resolution[0]}px`
              : frame.width
                ? `${frame.width}px`
                : 'auto',
            [styles.frameVars.height]: target()
              ? `${target()!.resolution[1]}px`
              : frame.height
                ? `${frame.height}px`
                : 'auto',
            [styles.frameVars.minWidth]: target() ? '0' : 'max-content',
            [styles.frameVars.minHeight]: target() ? '0' : '100%',
            [styles.frameVars.padding]: framePadding(
              frame.padding,
              frame.signature,
              scale(),
            ),
          })}
        >
          <div
            class={styles.previewOverlay}
            ref={element => watermark.attach('background', element)}
            data-watermark-background
            style={assignInlineVars({
              [styles.frameVars.backgroundColor]: assetsStore.isAssetUrl(
                frame.background,
              )
                ? 'transparent'
                : (frame.background ?? 'transparent'),
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

          <FittedWindow active={!!target()} watermark={watermark}>
            <DynamicTerminal
              type={terminal.type}
              activeTabId={props.tab?.id}
              readonlyTab={true}
              showTab={true}
              showOnlyActiveTab={exportCanvasStore.get.showOnlyActiveTab}
              shadow={terminal.shadow}
              background={terminal.background}
              accentVisible={terminal.accentVisible}
              textColor={terminal.textColor}
              showHeader={terminal.showHeader}
              showGlassReflection={terminal.showGlassReflection}
              showWatermark={terminal.showWatermark}
              opacity={terminal.opacity}
              alternativeTheme={terminal.alternativeTheme}
              borderType={terminal.borderType}
              surface={terminal.surface}
              themeId={editor.state.options.themeId}
            >
              <Show when={tab()}>
                {active => (
                  <StaticCodeView
                    code={active().code}
                    marks={active().marks}
                    languageId={active().languageId}
                    language={
                      props.language === undefined
                        ? language.latest
                        : props.language
                    }
                    theme={theme()!}
                    showLineNumbers={editor.state.options.showLineNumbers}
                    lineNumberStart={active().lineNumberStart ?? 1}
                    fontFamily={editor.computed.selectedFont().name}
                    fontWeight={editor.state.options.fontWeight}
                    enableLigatures={editor.state.options.enableLigatures}
                  />
                )}
              </Show>
            </DynamicTerminal>
          </FittedWindow>
          <FrameSignature
            signature={frame.signature}
            background={frame.background}
            scale={scale()}
            markRef={element => watermark.attach('signature', element)}
          />
        </div>
      </div>
    </PreviewPortal>
  );
}
