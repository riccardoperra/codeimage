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

interface Size {
  width: number;
  height: number;
}

export const fitScale = (viewport: Size, content: Size) =>
  Math.min(1, viewport.width / content.width, viewport.height / content.height);

function fitFrameWindow(frame: HTMLElement) {
  const content = frame.querySelector<HTMLElement>('[data-fitted-window]');
  const viewport = content?.parentElement;
  if (!content || !viewport || !viewport.hasAttribute('data-fit-window'))
    return false;
  const width = Math.max(content.offsetWidth, content.scrollWidth);
  const height = Math.max(content.offsetHeight, content.scrollHeight);
  const scale = fitScale(
    {width: viewport.clientWidth, height: viewport.clientHeight},
    {width, height},
  );
  const transform = `translate(-50%, -50%) scale(${scale})`;
  if (content.style.transform === transform) return false;
  content.style.transform = transform;
  return true;
}

/** The window's box in a frame, and the watermark scope its children register in. */
export function FittedWindow(
  props: ParentProps<{active: boolean; watermark: WatermarkScope}>,
) {
  const [viewport, setViewport] = createSignal<HTMLDivElement>();
  const [content, setContent] = createSignal<HTMLDivElement>();
  const watermark = untrack(() => props.watermark);
  const fit = () => {
    const element = viewport();
    if (element && props.active && fitFrameWindow(element))
      watermark.invalidate();
  };
  createResizeObserver(viewport, fit);
  createResizeObserver(content, fit);
  createEffect(fit);
  onMount(() => {
    watermark.attach('fit', fit);
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
                left: '50%',
                top: '50%',
                width: 'max-content',
                'min-width': `${FITTED_WINDOW_MIN_WIDTH}px`,
                'transform-origin': 'center',
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
