import type {CustomTheme} from '@codeimage/highlight';
import {isAssetUrl} from '@codeimage/store/assets/assetIds';
import type {FrameState} from '@codeimage/store/frame/model';
import {parseToRgb, rgb} from 'polished';
import type {JSX, ParentProps} from 'solid-js';
import {Show, splitProps} from 'solid-js';

/** The solid colour a clip composites onto when nothing else picks one. */
export function animationMatte(theme: CustomTheme): string {
  const {red, green, blue} = parseToRgb(theme.properties.terminal.main);
  return rgb(red, green, blue);
}

export type AnimationCanvasProps = ParentProps<
  JSX.HTMLAttributes<HTMLDivElement> & {
    width: number;
    height: number;
    /** The opaque colour under the frame background. */
    matte: string;
    frame: Pick<FrameState, 'background' | 'opacity' | 'visible'>;
    /** The loaded frame background image, when the background is an asset. */
    image: string | null;
  }
>;

// One fixed canvas for a whole clip, in the web export and in Node. The
// frame background covers all of it once, so each scene draws its frame
// without its own background (`data-watermark-background`) on top.
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
            {src => (
              <img
                src={src()}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  'object-fit': 'cover',
                }}
              />
            )}
          </Show>
        </div>
      </Show>
      {local.children}
    </div>
  );
}
