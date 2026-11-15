import {createResizeObserver} from '@solid-primitives/resize-observer';
import {
  createEffect,
  createSignal,
  onMount,
  onCleanup,
  type ParentProps,
} from 'solid-js';

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

export function FittedWindow(
  props: ParentProps<{active: boolean; placement?: FittedPlacement}>,
) {
  const [viewport, setViewport] = createSignal<HTMLDivElement>();
  const [content, setContent] = createSignal<HTMLDivElement>();
  const [measured, setMeasured] = createSignal<FittedPlacement>({
    left: 0,
    top: 0,
    scale: 1,
  });
  const placement = () => props.placement ?? measured();
  const fit = () => {
    const element = viewport();
    const window = content();
    if (!element || !window || !props.active || props.placement) return;
    setMeasured(
      fittedPlacement(
        {width: element.clientWidth, height: element.clientHeight},
        {
          width: Math.max(window.offsetWidth, window.scrollWidth),
          height: Math.max(window.offsetHeight, window.scrollHeight),
        },
      ),
    );
  };
  createResizeObserver(viewport, fit);
  createResizeObserver(content, fit);
  createEffect(fit);
  onMount(() => {
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
        {props.children}
      </div>
    </div>
  );
}
