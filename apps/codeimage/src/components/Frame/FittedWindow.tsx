import {createEffect, createSignal, onSettled, untrack} from 'solid-js';
import type {ParentProps} from 'solid-js';
import type {JSX} from '@solidjs/web';
import type {WatermarkScope} from '../../core/watermark/scope';
import {WatermarkContext} from '../../core/watermark/scope';

export const FITTED_WINDOW_MIN_WIDTH = 480;

export const naturalWindowStyle = {
  display: 'block',
  width: 'max-content',
  'min-width': `${FITTED_WINDOW_MIN_WIDTH}px`,
} satisfies JSX.CSSProperties;

export interface Size {
  width: number;
  height: number;
}

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

export function FittedWindow(
  props: ParentProps<{
    active: boolean;
    natural?: boolean;
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
  const readFit = () => ({
    box: viewport(),
    fitted: content(),
    active: props.active,
    placement: props.placement,
  });
  const fitWindow = ({
    box,
    fitted,
    active,
    placement,
  }: ReturnType<typeof readFit>) => {
    if (!box || !fitted || !active || placement) return;
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

    setMeasured(next);
    watermark.invalidate();
  };
  const fit = () => fitWindow(untrack(readFit));
  createEffect(readFit, fitWindow);
  onSettled(() => {
    const {box, fitted, placement} = untrack(readFit);
    if (!box || !fitted) return;
    const detach = watermark.attach('fit', fit);
    if (placement) return detach;
    const resizeObserver = new ResizeObserver(fit);
    resizeObserver.observe(box);
    resizeObserver.observe(fitted);
    const mutationObserver = new MutationObserver(fit);
    mutationObserver.observe(fitted, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      detach();
    };
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
            : props.natural
              ? {...naturalWindowStyle, transform: 'none'}
              : {display: 'contents', transform: 'none'}
        }
      >
        <WatermarkContext value={watermark}>{props.children}</WatermarkContext>
      </div>
    </div>
  );
}
