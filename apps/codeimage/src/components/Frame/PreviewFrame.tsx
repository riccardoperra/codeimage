import type {AnimationHeader, Size} from '@core/animation/model';
import {FittedWindow, naturalWindowStyle} from './FittedWindow';
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
import type {JSX, ParentProps, Ref, VoidProps} from 'solid-js';
import {
  createEffect,
  createMemo,
  createResource,
  on,
  onMount,
  Show,
  Suspense,
} from 'solid-js';
import {
  bindWatermarkExport,
  createWatermarkScope,
  WatermarkContext,
} from '../../core/watermark/scope';
import {Portal} from 'solid-js/web';
import {provideState} from 'statebuilder';
import {isKeyOwnedByFocus, useHotkey} from '../../hooks/use-hotkey';
import {DynamicTerminal} from '../Terminal/DynamicTerminal/DynamicTerminal';
import StaticCodeView from '../CustomEditor/StaticCodeView';
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

// The terminal theme and code font that every static or animated view of the
// frame draws with.
export function useFrameCodeStyle() {
  const editor = getRootEditorStore();
  const theme = createMemo(() => {
    const themes = getThemeStore().themeArray();
    return (
      themes.find(theme => theme()?.id === editor.state.options.themeId)?.() ??
      themes[0]()
    );
  });
  return {
    theme,
    fontFamily: () => editor.computed.selectedFont().name,
    fontWeight: () => editor.state.options.fontWeight,
    enableLigatures: () => editor.state.options.enableLigatures,
    showLineNumbers: () => editor.state.options.showLineNumbers,
  };
}

export interface FrameViewProps {
  targetSize?: Size;
  header?: AnimationHeader;
  ref?: Ref<HTMLDivElement>;
  activeTabId?: string;
  code: JSX.Element;
  // Marks the frame and its window for the rules of an animation scene, and
  // takes the window out of FittedWindow so those rules can place it.
  animated?: boolean;
  // Sizes the frame from its code, as the static export of one animation
  // step, instead of from the editor frame on screen.
  natural?: boolean;
  // The fixed animation canvas width, shared by all of its steps.
  signatureWidth?: number;
}

// The frame as the export draws it, around any code view.
export function FrameView(props: VoidProps<FrameViewProps>) {
  const frame = getFrameState().store;
  const target = () =>
    props.targetSize
      ? {
          resolution: [
            props.targetSize.width,
            props.targetSize.height,
          ] satisfies [number, number],
        }
      : getFrameState().exportTarget();
  const scale = () =>
    signatureScale(
      props.signatureWidth ??
        target()?.resolution[0] ??
        (props.natural ? 0 : frame.width),
    );
  const terminal = getTerminalState().state;
  const editor = getRootEditorStore();
  const assetsStore = getAssetsStore();
  const watermark = createWatermarkScope();
  createEffect(on(() => frame.signature?.position, watermark.invalidate));
  const exportCanvasStore = getExportCanvasStore();

  const terminalView = () => (
    <DynamicTerminal
      type={terminal.type}
      activeTabId={props.activeTabId}
      readonlyTab={true}
      staticTabs={!!props.header}
      headerMode={props.header?.mode}
      title={props.header?.mode === 'title' ? props.header.title : undefined}
      showTab={props.header?.mode !== 'title'}
      showOnlyActiveTab={
        props.header
          ? props.header.mode === 'tab'
          : exportCanvasStore.get.showOnlyActiveTab
      }
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
      {props.code}
    </DynamicTerminal>
  );

  return (
    <div
      class={styles.previewWrapper}
      ref={createRef<'div'>(props, element =>
        bindWatermarkExport(element, watermark),
      )}
    >
      <div
        class={styles.container}
        ref={element => watermark.attach('frame', element)}
        data-watermark-frame
        data-animation-frame={props.animated ? '' : undefined}
        style={assignInlineVars({
          overflow: 'hidden',
          [styles.frameVars.radius]: `${frame.radius}px`,
          [styles.frameVars.width]: target()
            ? `${target()!.resolution[0]}px`
            : frame.width && !props.natural
              ? `${frame.width}px`
              : 'auto',
          [styles.frameVars.height]: target()
            ? `${target()!.resolution[1]}px`
            : frame.height && !props.natural
              ? `${frame.height}px`
              : 'auto',
          [styles.frameVars.minWidth]: target() ? '0' : 'max-content',
          [styles.frameVars.minHeight]:
            target() || props.animated ? '0' : '100%',
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

        <Show
          when={props.animated}
          fallback={
            <FittedWindow
              active={!!target()}
              natural={props.natural}
              watermark={watermark}
            >
              {terminalView()}
            </FittedWindow>
          }
        >
          <div
            data-animation-window
            style={props.natural ? naturalWindowStyle : {display: 'contents'}}
          >
            <WatermarkContext.Provider value={watermark}>
              {terminalView()}
            </WatermarkContext.Provider>
          </div>
        </Show>
        <FrameSignature
          signature={frame.signature}
          background={frame.background}
          scale={scale()}
          markRef={element => watermark.attach('signature', element)}
        />
      </div>
    </div>
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
  const style = useFrameCodeStyle();

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
      <FrameView
        ref={createRef<'div'>(props, el => (ref = el))}
        activeTabId={props.tab?.id}
        code={
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
                theme={style.theme()!}
                showLineNumbers={style.showLineNumbers()}
                lineNumberStart={active().lineNumberStart ?? 1}
                fontFamily={style.fontFamily()}
                fontWeight={style.fontWeight()}
                enableLigatures={style.enableLigatures()}
              />
            )}
          </Show>
        }
      />
    </PreviewPortal>
  );
}
