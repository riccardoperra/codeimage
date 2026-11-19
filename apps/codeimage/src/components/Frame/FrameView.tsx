import {createFrameTerminal} from './FrameTerminal';
import * as viewStyles from './FrameView.css';
import {getExportTarget} from '@codeimage/config';
import type {AnimationHeader, Size} from '@core/animation/model';
import type {CustomTheme} from '@codeimage/highlight';
import type {FrameState} from '@codeimage/store/frame/model';
import type {FittedPlacement} from './FittedWindow';
import {frameBottomPadding} from './signatureLayout';
import {FittedWindow, naturalWindowStyle} from './FittedWindow';
import {FrameSignature, framePadding, signatureScale} from './FrameSignature';
import {isAssetUrl} from '@codeimage/store/assets/assetIds';
import type {FrameMedia} from './frameMedia';
import {getFrameState} from '@codeimage/store/editor/frame';
import type {EditorState} from '@codeimage/store/editor/model';
import type {Language} from '@codemirror/language';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import type {JSX} from '@solidjs/web';
import type {Ref, VoidProps} from 'solid-js';
import {createEffect, Show} from 'solid-js';

import {
  createWatermarkExportRef,
  createWatermarkRef,
  createWatermarkScope,
  WatermarkContext,
} from '@core/watermark/scope';
import * as styles from './Frame.css';

export interface FrameViewProps {
  ref?: Ref<HTMLDivElement>;
  tab?: EditorState;
  activeTabId?: string;
  language?: Language | null;
  theme?: CustomTheme;
  media: FrameMedia;
  windowPlacement?: FittedPlacement;
  showOnlyActiveTab?: boolean;
  code?: JSX.Element;
  targetSize?: Size;
  header?: AnimationHeader;
  animated?: boolean;
  natural?: boolean;
  signatureWidth?: number;
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
  const dimensions = () => frameDimensions(frame, target(), props.natural);
  const scale = () =>
    frameSignatureScale(frame, target(), {
      natural: props.natural,
      signatureWidth: props.signatureWidth,
    });

  const terminalView = createFrameTerminal(props);
  const watermark = createWatermarkScope();
  const exportRef = createWatermarkExportRef(watermark);
  const frameRef = createWatermarkRef(watermark, 'frame');
  const backgroundRef = createWatermarkRef(watermark, 'background');
  createEffect(() => frame.signature?.position, watermark.invalidate);

  return (
    <div
      class={styles.previewWrapper}
      ref={element => {
        exportRef(element);
        const ref = props.ref;
        if (typeof ref === 'function') ref(element);
      }}
    >
      <div
        class={styles.container}
        ref={frameRef}
        data-watermark-frame
        data-snapshot-frame
        data-animation-frame={props.animated ? '' : undefined}
        style={assignInlineVars({
          overflow: 'hidden',
          [styles.frameVars.radius]: `${frame.radius}px`,
          [styles.frameVars.width]: dimensions().width,
          [styles.frameVars.height]: dimensions().height,
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
          ref={backgroundRef}
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
            {src => <img src={src()} class={viewStyles.backgroundImage} />}
          </Show>
        </div>

        <Show
          when={props.animated}
          fallback={
            <FittedWindow
              active={!!target()}
              natural={props.natural}
              watermark={watermark}
              placement={props.windowPlacement}
            >
              {terminalView()}
            </FittedWindow>
          }
        >
          <div
            data-animation-window
            style={props.natural ? naturalWindowStyle : {display: 'contents'}}
          >
            <WatermarkContext value={watermark}>
              {terminalView()}
            </WatermarkContext>
          </div>
        </Show>
        <FrameSignature
          signature={frame.signature}
          media={props.media}
          background={frame.background}
          scale={scale()}
          watermark={watermark}
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
  options: {natural?: boolean; signatureWidth?: number} = {},
): number {
  return signatureScale(
    options.signatureWidth ??
      target?.resolution[0] ??
      (options.natural ? 0 : frame.width),
  );
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

function frameDimensions(
  frame: Pick<FrameState, 'width' | 'height'>,
  target: ReturnType<typeof getExportTarget> | {resolution: [number, number]},
  natural?: boolean,
) {
  if (target)
    return {
      width: target.resolution[0] + 'px',
      height: target.resolution[1] + 'px',
    };
  return {
    width: frame.width && !natural ? frame.width + 'px' : 'max-content',
    height: frame.height && !natural ? frame.height + 'px' : 'auto',
  };
}
