import {Box, FadeInOutTransition} from '@codeimage/ui';
import {
  createSignal,
  onSettled,
  Show,
  untrack,
  createTrackedEffect,
} from 'solid-js';
import {Portal} from '@solidjs/web';
import type {JSX} from '@solidjs/web';
import {
  placeWatermark,
  canHostWatermarkFrame,
  WATERMARK,
} from '@codeimage/render/watermark';
import type {Rect} from '@codeimage/render/watermark';
import {
  codeRects,
  codeRoot,
  useWatermarkScope,
} from '../../core/watermark/scope';
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

interface Reading {
  slot: string;
  naturalHeight: number;
  mark: MovedMark | null;
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
  const scope = useWatermarkScope();
  if (!scope) throw new Error('A watermark must render inside a frame.');
  let home!: HTMLDivElement;
  const [moved, setMoved] = createSignal<MovedMark | null>(null);
  const [height, setHeight] = createSignal(24.3);

  const read = () => {
    const {window, content, frame, background, signature, header, code} =
      scope.parts();
    const size = home?.isConnected && home.firstElementChild;
    if (!window || !content || !size) return;
    const natural = size.getBoundingClientRect();
    if (!natural.width || !natural.height) return;
    const windowRect = window.getBoundingClientRect();
    const scale = windowRect.width / window.offsetWidth;
    const naturalHeight = natural.height / scale;
    const obstacles: Rect[] = [];
    for (const el of window.querySelectorAll<HTMLElement>(
      WATERMARK.obstacles,
    )) {
      if (!el.closest('[data-watermark-home], [data-watermark-moved]'))
        obstacles.push(el.getBoundingClientRect());
    }
    if (header) obstacles.push(...textRects(header));
    if (frame && signature) obstacles.push(signature.getBoundingClientRect());
    const paint = frame && background && getComputedStyle(background);
    const painted =
      paint &&
      canHostWatermarkFrame({
        visible: paint.visibility !== 'hidden',
        opacity: Number(paint.opacity),
        backgroundColor: paint.backgroundColor,
        hasImage:
          paint.backgroundImage !== 'none' || !!background.querySelector('img'),
      });
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
                (WATERMARK.frameInset *
                  signatureScale(frame.offsetWidth) *
                  frame.getBoundingClientRect().width) /
                frame.offsetWidth,
            }
          : null,
      code: code ? codeRects(code, textRects) : [],
      obstacles,
      gap: WATERMARK.gap * scale,
    });
    if (!('rect' in placement))
      return {slot: placement.slot, naturalHeight, mark: null};
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
      opacity: WATERMARK.opacity,
      'pointer-events': 'none',
      'z-index': WATERMARK.zIndex,
      transform: `scale(${fit})`,
      'transform-origin': `${end ? 'bottom' : 'top'} ${start ? 'left' : 'right'}`,
    };
    const key = JSON.stringify([placement.slot, right, left, top, bottom, fit]);
    return {
      slot: placement.slot,
      naturalHeight,
      mark: {host, slot: placement.slot, style, key},
    };
  };

  const write = (reading: Reading) => {
    if (!moved()) setHeight(reading.naturalHeight);
    home.dataset.watermarkPlacement = reading.slot;
    const current = moved();
    const mark = reading.mark;
    if (!mark) {
      if (current) setMoved(null);
    } else if (current?.key !== mark.key || current.host !== mark.host)
      setMoved(mark);
  };

  const measure = () => {
    const reading = read();
    return reading && (() => untrack(() => write(reading)));
  };

  onSettled(() => {
    const detach = scope.attach('measure', measure);
    document.fonts.addEventListener('loadingdone', scope.invalidate);
    void document.fonts.ready.then(scope.invalidate);
    return () => {
      detach();
      document.fonts.removeEventListener('loadingdone', scope.invalidate);
    };
  });

  createTrackedEffect(() => {
    const {frame, window, content, header, background, signature, code} =
      scope.parts();
    const resize = new ResizeObserver(scope.invalidate);
    for (const el of [
      frame,
      window,
      content,
      header,
      signature,
      code && codeRoot(code),
    ])
      if (el) resize.observe(el);
    const mutation = new MutationObserver(scope.invalidate);
    for (const el of [header, background])
      if (el)
        mutation.observe(el, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
        });
    const scroller = frame ?? window;
    scroller?.addEventListener('scroll', scope.invalidate, true);
    return () => {
      resize.disconnect();
      mutation.disconnect();
      scroller?.removeEventListener('scroll', scope.invalidate, true);
    };
  });

  const logo = () => (
    <CodeImageLogoV2
      width={WATERMARK.width}
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
                width: `${WATERMARK.width}px`,
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
            ref={(element: HTMLDivElement) => {
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
