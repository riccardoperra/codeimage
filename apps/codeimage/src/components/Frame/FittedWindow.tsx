import {createResizeObserver} from '@solid-primitives/resize-observer';
import {
  createEffect,
  createSignal,
  onMount,
  onCleanup,
  untrack,
  type ParentProps,
} from 'solid-js';
import type {WatermarkScope} from '../../core/watermark/scope';
import {WatermarkContext} from '../../core/watermark/scope';

export const FITTED_WINDOW_MIN_WIDTH = 480;

export interface Size {
  width: number;
  height: number;
}

// The window shrinks to fit the frame but never grows past its natural size.
export const fitScale = (viewport: Size, content: Size) =>
  Math.max(
    0,
    Math.min(
      1,
      viewport.width / content.width,
      viewport.height / content.height,
    ),
  );

export interface FittedPlacement {
  readonly left: number;
  readonly top: number;
  readonly scale: number;
}

export function fittedPlacement(
  viewport: Size,
  content: Size,
): FittedPlacement {
  const scale = fitScale(viewport, content);
  return {
    left: Math.round((viewport.width - content.width * scale) / 2),
    top: Math.round((viewport.height - content.height * scale) / 2),
    scale,
  };
}

/**
 * The window's box in a frame, and the watermark scope its children register
 * in. A given placement (Node) replaces the browser's measurement.
 */
export function FittedWindow(
  props: ParentProps<{
    active: boolean;
    watermark: WatermarkScope;
    placement?: FittedPlacement;
  }>,
) {
  const [viewport, setViewport] = createSignal<HTMLDivElement>();
  const [content, setContent] = createSignal<HTMLDivElement>();
  const watermark = untrack(() => props.watermark);
  const [measured, setMeasured] = createSignal<FittedPlacement>({
    left: 0,
    top: 0,
    scale: 1,
  });
  const placement = () => props.placement ?? measured();
  const fit = () => {
    const box = viewport();
    const fitted = content();
    if (!box || !fitted || !props.active || props.placement) return;
    const next = fittedPlacement(
      {width: box.clientWidth, height: box.clientHeight},
      {
        width: Math.max(fitted.offsetWidth, fitted.scrollWidth),
        height: Math.max(fitted.offsetHeight, fitted.scrollHeight),
      },
    );
    const current = untrack(measured);
    if (
      current.left === next.left &&
      current.top === next.top &&
      current.scale === next.scale
    )
      return;
    // Setting the signal outside a batch restyles the window synchronously,
    // which the watermark's export preparation relies on.
    setMeasured(next);
    watermark.invalidate();
  };
  createResizeObserver(viewport, fit);
  createResizeObserver(content, fit);
  createEffect(fit);
  onMount(() => {
    watermark.attach('fit', fit);
    if (props.placement) return;
    const observer = new MutationObserver(fit);
    observer.observe(content()!, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    onCleanup(() => observer.disconnect());
  });

  return (
    <div
      ref={setViewport}
      data-fit-window={props.active ? '' : undefined}
      style={
        props.active
          ? {
              position: 'relative',
              width: '100%',
              height: '100%',
              'min-width': '0',
              'min-height': '0',
            }
          : {display: 'contents'}
      }
    >
      <div
        ref={setContent}
        data-fitted-window
        style={
          props.active
            ? {
                position: 'absolute',
                left: `${placement().left}px`,
                top: `${placement().top}px`,
                transform: `scale(${placement().scale})`,
                width: 'max-content',
                'min-width': `${FITTED_WINDOW_MIN_WIDTH}px`,
                'transform-origin': '0 0',
              }
            : {display: 'contents', transform: 'none'}
        }
      >
        <WatermarkContext.Provider value={watermark}>
          {props.children}
        </WatermarkContext.Provider>
      </div>
    </div>
  );
}
