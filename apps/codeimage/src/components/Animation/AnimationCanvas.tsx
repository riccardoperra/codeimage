import * as styles from './AnimationCanvas.css';
import type {CustomTheme} from '@codeimage/highlight';
import {isAssetUrl} from '@codeimage/store/assets/assetIds';
import type {FrameState} from '@codeimage/store/frame/model';
import {parseToRgb, rgb} from 'polished';
import type {JSX, ParentProps} from 'solid-js';
import {Show, splitProps} from 'solid-js';

export function animationMatte(theme: CustomTheme): string {
  const {red, green, blue} = parseToRgb(theme.properties.terminal.main);
  return rgb(red, green, blue);
}

export type AnimationCanvasProps = ParentProps<
  JSX.HTMLAttributes<HTMLDivElement> & {
    width: number;
    height: number;

    matte: string;
    frame: Pick<FrameState, 'background' | 'opacity' | 'visible'>;

    image: string | null;
  }
>;

export function AnimationCanvas(props: AnimationCanvasProps) {
  const [local, rest] = splitProps(props, [
    'width',
    'height',
    'matte',
    'frame',
    'image',
    'children',
  ]);
  return (
    <div
      {...rest}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: `${local.width}px`,
        height: `${local.height}px`,
        'background-color': local.matte,
      }}
    >
      <Show when={local.frame.visible && local.frame.opacity > 0}>
        <div
          data-video-background
          style={{
            position: 'absolute',
            inset: 0,
            background: isAssetUrl(local.frame.background)
              ? undefined
              : (local.frame.background ?? undefined),
            opacity: local.frame.opacity / 100,
          }}
        >
          <Show when={isAssetUrl(local.frame.background) && local.image}>
            {src => <img src={src()} class={styles.backgroundImage} />}
          </Show>
        </div>
      </Show>
      {local.children}
    </div>
  );
}
