import {Box, FadeInOutTransition} from '@codeimage/ui';
import {createSignal, onCleanup, onMount, Show} from 'solid-js';
import {Portal} from 'solid-js/web';
import type {JSX} from 'solid-js';
import {registerWatermark} from '../../core/watermark/browser';
import {placeWatermark} from '@codeimage/render/watermark';
import type {Rect} from '@codeimage/render/watermark';
import {signatureScale} from '../Frame/signatureLayout';
import {CodeImageLogoV2} from '../Icons/CodeImageLogoV2';
import * as styles from '../Terminal/terminal.css';

function textRects(root: Element): Rect[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const result: Rect[] = [];
  let node = walker.nextNode();
  while (node) {
    const text = node.textContent ?? '';
    const parent = node.parentElement;
    if (
      parent &&
      !parent.closest(
        '[data-watermark-home], [data-watermark-moved], script, style',
      )
    ) {
      const visibility = getComputedStyle(parent);
      if (visibility.visibility !== 'hidden' && visibility.display !== 'none') {
        for (const match of text.matchAll(/\S+/gu)) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          for (const rect of range.getClientRects())
            if (rect.width && rect.height) result.push(rect);
        }
      }
    }
    node = walker.nextNode();
  }
  return result;
}

interface MovedMark {
  host: HTMLElement;
  slot: string;
  style: JSX.CSSProperties;
  key: string;
}

export function Watermark(props: {enabled: boolean; darkMode: boolean}) {
  return (
    <FadeInOutTransition show={props.enabled}>
      <Show when={props.enabled}>
        <MountedWatermark darkMode={props.darkMode} />
      </Show>
    </FadeInOutTransition>
  );
}

function MountedWatermark(props: {darkMode: boolean}) {
  let home!: HTMLDivElement;
  const [moved, setMoved] = createSignal<MovedMark | null>(null);
  const [height, setHeight] = createSignal(24.3);
  let disposed = false;
  let pending = 0;

  const measure = () => {
    if (disposed || !home?.isConnected) return;
    const window = home.closest<HTMLElement>('[data-surface]');
    const content = home.closest<HTMLElement>('[data-watermark-content]');
    const frame = home.closest<HTMLElement>('[data-watermark-frame]');
    const size = home.firstElementChild;
    if (!window || !content || !size) return;
    const natural = size.getBoundingClientRect();
    if (!natural.width || !natural.height) return;
    const windowRect = window.getBoundingClientRect();
    const scale = windowRect.width / window.offsetWidth;
    if (!moved()) setHeight(natural.height / scale);
    const header = window.querySelector<HTMLElement>('[data-watermark-header]');
    const code = Array.from(window.querySelectorAll('.cm-line')).flatMap(
      textRects,
    );
    const obstacles: Rect[] = [];
    for (const el of window.querySelectorAll<HTMLElement>(
      '[data-watermark-obstacle], button, [role=tab]',
    )) {
      if (!el.closest('[data-watermark-home], [data-watermark-moved]'))
        obstacles.push(el.getBoundingClientRect());
    }
    if (header) obstacles.push(...textRects(header));
    if (frame) {
      const signature = frame.querySelector(
        '[data-frame-signature]',
      )?.firstElementChild;
      if (signature) obstacles.push(signature.getBoundingClientRect());
    }
    const backdrop = frame?.querySelector<HTMLElement>(
      '[data-watermark-background]',
    );
    const paint = backdrop && getComputedStyle(backdrop);
    const transparent =
      !paint ||
      paint.backgroundColor === 'transparent' ||
      /(?:,|\/)\s*0(?:\.0+)?\s*\)$/.test(paint.backgroundColor);
    const painted =
      paint &&
      paint.visibility !== 'hidden' &&
      Number(paint.opacity) > 0 &&
      (!transparent ||
        paint.backgroundImage !== 'none' ||
        !!backdrop?.querySelector('img'));
    const placement = placeWatermark({
      home: natural,
      window: windowRect,
      content: content.getBoundingClientRect(),
      header: header?.getBoundingClientRect() ?? null,
      frame:
        frame && painted
          ? {
              bounds: frame.getBoundingClientRect(),
              inset:
                (24 *
                  signatureScale(frame.offsetWidth) *
                  frame.getBoundingClientRect().width) /
                frame.offsetWidth,
            }
          : null,
      code,
      obstacles,
      gap: 4 * scale,
    });
    home.dataset.watermarkPlacement = placement.slot;
    if (!('rect' in placement)) {
      if (moved()) setMoved(null);
      return;
    }
    const host = placement.slot.startsWith('frame-') && frame ? frame : window;
    const hostRect = host.getBoundingClientRect();
    const hostScale = hostRect.width / host.offsetWidth;
    const right =
      (hostRect.right - placement.rect.x - placement.rect.width) / hostScale -
      host.clientLeft;
    const top = (placement.rect.y - hostRect.top) / hostScale - host.clientTop;
    const left =
      (placement.rect.x - hostRect.left) / hostScale - host.clientLeft;
    const bottom =
      (hostRect.bottom - placement.rect.y - placement.rect.height) / hostScale -
      host.clientTop;
    const fit = scale / hostScale;
    const start = placement.slot.endsWith('-left');
    const end = placement.slot.startsWith('frame-bottom');
    const style: JSX.CSSProperties = {
      position: 'absolute',
      ...(start ? {left: `${left}px`} : {right: `${right}px`}),
      ...(end ? {bottom: `${bottom}px`} : {top: `${top}px`}),
      display: 'flex',
      opacity: 0.35,
      'pointer-events': 'none',
      'z-index': 3,
      transform: `scale(${fit})`,
      'transform-origin': `${end ? 'bottom' : 'top'} ${start ? 'left' : 'right'}`,
    };
    const key = JSON.stringify([placement.slot, right, left, top, bottom, fit]);
    if (moved()?.key !== key || moved()?.host !== host)
      setMoved({host, slot: placement.slot, style, key});
  };
  const schedule = () => {
    if (disposed || pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      measure();
    });
  };

  onMount(() => {
    const unregister = registerWatermark(home, measure);
    onCleanup(unregister);
    const root =
      home.closest<HTMLElement>('[data-watermark-frame]') ??
      home.closest<HTMLElement>('[data-surface]');
    if (!root) return;
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    for (const el of root.querySelectorAll<HTMLElement>(
      '[data-surface], [data-watermark-content], .cm-content, [data-frame-signature]',
    ))
      resize.observe(el);
    const mutation = new MutationObserver(records => {
      if (
        records.some(record => {
          const element =
            record.target instanceof Element
              ? record.target
              : record.target.parentElement;
          return !element?.closest(
            '[data-watermark-home], [data-watermark-moved]',
          );
        })
      )
        schedule();
    });
    mutation.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'data-header-visible'],
    });
    root.addEventListener('scroll', schedule, true);
    document.fonts.addEventListener('loadingdone', schedule);
    void document.fonts.ready.then(schedule);
    schedule();
    onCleanup(() => {
      resize.disconnect();
      mutation.disconnect();
      root.removeEventListener('scroll', schedule, true);
      document.fonts.removeEventListener('loadingdone', schedule);
      disposed = true;
      cancelAnimationFrame(pending);
    });
  });

  const logo = () => (
    <CodeImageLogoV2
      width={125}
      withGradient={false}
      data-theme-mode={props.darkMode ? 'dark' : 'light'}
    />
  );
  return (
    <>
      <Box ref={home} class={styles.watermark} data-watermark-home>
        <Show
          when={!moved()}
          fallback={
            <span
              style={{
                display: 'inline-block',
                width: '125px',
                height: `${height()}px`,
              }}
            />
          }
        >
          {logo()}
        </Show>
      </Box>
      <Show when={moved()}>
        {mark => (
          <Portal
            mount={mark().host}
            ref={element => {
              element.style.display = 'contents';
            }}
          >
            <div data-watermark-moved={mark().slot} style={mark().style}>
              {logo()}
            </div>
          </Portal>
        )}
      </Show>
    </>
  );
}
