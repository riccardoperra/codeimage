import {createResizeObserver} from '@solid-primitives/resize-observer';
import {
  createEffect,
  createSignal,
  onMount,
  onCleanup,
  type ParentProps,
} from 'solid-js';

function fitFrameWindow(frame: HTMLElement) {
  const content = frame.querySelector<HTMLElement>('[data-fitted-window]');
  const viewport = content?.parentElement;
  if (!content || !viewport || !viewport.hasAttribute('data-fit-window'))
    return;
  const width = Math.max(content.offsetWidth, content.scrollWidth);
  const height = Math.max(content.offsetHeight, content.scrollHeight);
  const scale = Math.min(
    1,
    viewport.clientWidth / width,
    viewport.clientHeight / height,
  );
  const transform = `translate(-50%, -50%) scale(${scale})`;
  if (content.style.transform !== transform)
    content.style.transform = transform;
}

export function FittedWindow(props: ParentProps<{active: boolean}>) {
  const [viewport, setViewport] = createSignal<HTMLDivElement>();
  const [content, setContent] = createSignal<HTMLDivElement>();
  const fit = () => {
    const element = viewport();
    if (element && props.active) fitFrameWindow(element);
  };
  createResizeObserver(viewport, fit);
  createResizeObserver(content, fit);
  createEffect(fit);
  onMount(() => {
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
                'min-width': '480px',
                'transform-origin': 'center',
              }
            : {display: 'contents', transform: 'none'}
        }
      >
        {props.children}
      </div>
    </div>
  );
}
