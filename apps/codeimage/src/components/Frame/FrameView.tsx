import {getExportTarget} from '@codeimage/config';
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
import type {Ref, VoidProps} from 'solid-js';
import {Show} from 'solid-js';
import {DynamicTerminal} from '../Terminal/DynamicTerminal/DynamicTerminal';
import StaticCodeView from '../CustomEditor/StaticCodeView';
import * as styles from './Frame.css';

export interface FrameViewProps {
  ref?: Ref<HTMLDivElement>;
  tab?: EditorState;
  language: Language | null;
  /** The syntax theme, already loaded. */
  theme: CustomTheme;
  media: FrameMedia;
  windowPlacement?: FittedPlacement;
  showOnlyActiveTab?: boolean;
}

export function FrameView(props: VoidProps<FrameViewProps>) {
  const frame = getFrameState().store;
  const target = () => getExportTarget(frame.exportTarget);
  const scale = () => frameSignatureScale(frame, target());
  const terminal = getTerminalState().state;
  const editor = getRootEditorStore();
  const tab = () => props.tab ?? getActiveEditorStore().editor();

  return (
    <div class={styles.previewWrapper} ref={props.ref}>
      <div
        class={styles.container}
        data-watermark-frame
        data-snapshot-frame
        style={assignInlineVars({
          overflow: 'hidden',
          [styles.frameVars.radius]: `${frame.radius}px`,
          [styles.frameVars.width]: target()
            ? `${target()!.resolution[0]}px`
            : frame.width
              ? `${frame.width}px`
              : 'max-content',
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

        <FittedWindow active={!!target()} placement={props.windowPlacement}>
          <DynamicTerminal
            type={terminal.type}
            activeTabId={props.tab?.id}
            readonlyTab={true}
            showTab={true}
            showOnlyActiveTab={props.showOnlyActiveTab}
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
                  language={props.language}
                  theme={props.theme}
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
          media={props.media}
          background={frame.background}
          scale={scale()}
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
