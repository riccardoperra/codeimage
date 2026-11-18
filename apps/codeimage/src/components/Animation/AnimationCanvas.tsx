import * as styles from './AnimationCanvas.css';
import type {CustomTheme} from '@codeimage/highlight';
import {isAssetUrl} from '@codeimage/store/assets/assetIds';
import type {FrameState} from '@codeimage/store/frame/model';
import {parseToRgb, rgb} from 'polished';
import type {JSX} from '@solidjs/web';
import type {ParentProps} from 'solid-js';
import {Show, omit} from 'solid-js';

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
  const rest = omit(
    props,
    'width',
    'height',
    'matte',
    'frame',
    'image',
    'children',
  );
  return (
    <div
      {...rest}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: `${props.width}px`,
        height: `${props.height}px`,
        'background-color': props.matte,
      }}
    >
      <Show when={props.frame.visible && props.frame.opacity > 0}>
        <div
          data-video-background
          style={{
            position: 'absolute',
            inset: 0,
            background: isAssetUrl(props.frame.background)
              ? undefined
              : (props.frame.background ?? undefined),
            opacity: props.frame.opacity / 100,
          }}
        >
          <Show when={isAssetUrl(props.frame.background) && props.image}>
            {src => <img src={src()} class={styles.backgroundImage} />}
          </Show>
        </div>
      </Show>
      {props.children}
    </div>
  );
}
