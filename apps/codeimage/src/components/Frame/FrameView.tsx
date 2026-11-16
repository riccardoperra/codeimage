import {getExportTarget} from '@codeimage/config';
import type {AnimationHeader, Size} from '@core/animation/model';
import type {CustomTheme} from '@codeimage/highlight';
import type {FrameState} from '@codeimage/store/frame/model';
import type {FittedPlacement} from './FittedWindow';
import {frameBottomPadding} from './signatureLayout';
import {FittedWindow} from './FittedWindow';
import {FrameSignature, framePadding, signatureScale} from './FrameSignature';
import {isAssetUrl} from '@codeimage/store/assets/assetIds';
import type {FrameMedia} from './frameMedia';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {getFrameState} from '@codeimage/store/editor/frame';
import type {EditorState} from '@codeimage/store/editor/model';
import type {Language} from '@codemirror/language';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import type {JSX, Ref, VoidProps} from 'solid-js';
import {createEffect, on, Show} from 'solid-js';
import {DynamicTerminal} from '../Terminal/DynamicTerminal/DynamicTerminal';
import StaticCodeView from '../CustomEditor/StaticCodeView';
import {
  bindWatermarkExport,
  createWatermarkScope,
  WatermarkContext,
} from '../../core/watermark/scope';
import * as styles from './Frame.css';

export interface FrameViewProps {
  ref?: Ref<HTMLDivElement>;
  tab?: EditorState;
  /** The tab the header shows as active, when `code` is not that tab's. */
  activeTabId?: string;
  /** The language and the loaded syntax theme of the tab's static code. */
  language?: Language | null;
  theme?: CustomTheme;
  media: FrameMedia;
  windowPlacement?: FittedPlacement;
  showOnlyActiveTab?: boolean;
  /** Replaces the tab's static code, as an animation scene does. */
  code?: JSX.Element;
  /** A frame of this size instead of the export target's. */
  targetSize?: Size;
  /** The header an animation shows in every scene. */
  header?: AnimationHeader;
  // Marks the frame and its window for the rules of an animation scene, and
  // takes the window out of FittedWindow so those rules can place it.
  animated?: boolean;
  // Sizes the frame from its code, as the static export of one animation
  // step, instead of from the editor frame on screen.
  natural?: boolean;
}

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
      : getExportTarget(frame.exportTarget);
  const scale = () => frameSignatureScale(frame, target());
  const terminal = getTerminalState().state;
  const editor = getRootEditorStore();
  const tab = () => props.tab ?? getActiveEditorStore().editor();
  // Each frame owns its watermark scope, so per-tab exports never share one.
  // The parts register through refs and effects, which Node never runs.
  const watermark = createWatermarkScope();
  createEffect(on(() => frame.signature?.position, watermark.invalidate));

  const terminalView = () => (
    <DynamicTerminal
      type={terminal.type}
      activeTabId={props.activeTabId ?? props.tab?.id}
      readonlyTab={true}
      staticTabs={!!props.header}
      headerMode={props.header?.mode}
      title={props.header?.mode === 'title' ? props.header.title : undefined}
      showTab={props.header?.mode !== 'title'}
      showOnlyActiveTab={
        props.header ? props.header.mode === 'tab' : props.showOnlyActiveTab
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
      {props.code ?? (
        <Show when={props.theme && tab()}>
          {active => (
            <StaticCodeView
              code={active().code}
              marks={active().marks}
              languageId={active().languageId}
              language={props.language ?? null}
              theme={props.theme!}
              showLineNumbers={editor.state.options.showLineNumbers}
              lineNumberStart={active().lineNumberStart ?? 1}
              fontFamily={editor.computed.selectedFont().name}
              fontWeight={editor.state.options.fontWeight}
              enableLigatures={editor.state.options.enableLigatures}
            />
          )}
        </Show>
      )}
    </DynamicTerminal>
  );

  return (
    <div
      class={styles.previewWrapper}
      ref={element => {
        // The export receives this element and prepares the watermark through it.
        bindWatermarkExport(element, watermark);
        const ref = props.ref;
        if (typeof ref === 'function') ref(element);
      }}
    >
      <div
        class={styles.container}
        ref={element => watermark.attach('frame', element)}
        data-watermark-frame
        data-snapshot-frame
        data-animation-frame={props.animated ? '' : undefined}
        style={assignInlineVars({
          overflow: 'hidden',
          [styles.frameVars.radius]: `${frame.radius}px`,
          [styles.frameVars.width]: target()
            ? `${target()!.resolution[0]}px`
            : frame.width && !props.natural
              ? `${frame.width}px`
              : 'max-content',
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
          ref={element => watermark.attach('background', element)}
          data-watermark-background
          class={styles.previewOverlay}
          style={assignInlineVars({
            [styles.frameVars.backgroundColor]: isAssetUrl(frame.background)
              ? 'transparent'
              : (frame.background ?? 'transparent'),
            [styles.frameVars.opacity]: `${frame.opacity}%`,
            [styles.frameVars.visibility]: `${
              frame.visible ? 'visible' : 'hidden'
            }`,
          })}
        >
          <Show when={props.media.backgroundImage}>
            {src => (
              <img
                src={src()}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  'object-fit': 'cover',
                }}
              />
            )}
          </Show>
        </div>

        <Show
          when={props.animated}
          fallback={
            <FittedWindow
              active={!!target()}
              watermark={watermark}
              placement={props.windowPlacement}
            >
              {terminalView()}
            </FittedWindow>
          }
        >
          <div data-animation-window style={{display: 'contents'}}>
            <WatermarkContext.Provider value={watermark}>
              {terminalView()}
            </WatermarkContext.Provider>
          </div>
        </Show>
        <FrameSignature
          signature={frame.signature}
          media={props.media}
          background={frame.background}
          scale={scale()}
          markRef={element => watermark.attach('signature', element)}
        />
      </div>
    </div>
  );
}

export function frameSignatureScale(
  frame: Pick<FrameState, 'width'>,
  target:
    | Pick<NonNullable<ReturnType<typeof getExportTarget>>, 'resolution'>
    | undefined,
): number {
  return signatureScale(target?.resolution[0] ?? frame.width);
}

export function targetViewport(
  resolution: readonly [number, number],
  padding: number,
  signature: FrameState['signature'],
  scale: number,
) {
  return {
    width: Math.max(0, resolution[0] - 2 * padding),
    height: Math.max(
      0,
      resolution[1] - padding - frameBottomPadding(padding, signature, scale),
    ),
  };
}
