import {Dialog} from '@kobalte/core/dialog';
import {createEffect, createMemo, createSignal, on, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {sidebarTheme} from '../../../../components/PropertyEditor/EditorSidebar.css';
import {closeOnEscape, useDock} from './context';
import * as styles from './dock.css';
import type {PanelId} from './fields';
import {PANELS} from './panels';

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Resistance past the resting position, from Apple's fluid interfaces sample. */
function rubberband(overshoot: number, dimension: number): number {
  const constant = 0.55;
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}

interface SheetProps {
  /** Taps in here switch or close the sheet themselves. */
  bar: () => HTMLElement | undefined;
  /** The element that opened the sheet, which gets focus back when it closes. */
  trigger: () => HTMLElement | undefined;
}

/**
 * The phone's surface for every panel of the dock. It sits in the layout
 * between the canvas and the bar and is at most 40% of the height, so the
 * preview stays in view above it. A drag on its handle closes it.
 */
export function Sheet(props: SheetProps) {
  const dock = useDock();
  const [slot, setSlot] = createSignal<HTMLDivElement>();
  let content: HTMLDivElement | undefined;
  let dismissedOutside = false;

  // The sheet keeps its content while it slides out.
  const shown = createMemo<PanelId | undefined>(
    previous => dock.panel() ?? previous,
  );

  const inBar = (target: EventTarget | null) =>
    target instanceof Node && !!props.bar()?.contains(target);

  createEffect(
    on(dock.panel, panel => {
      if (!panel) return;
      queueMicrotask(() => {
        if (!content || content.contains(document.activeElement)) return;
        (content.querySelector<HTMLElement>(FOCUSABLE) ?? content).focus();
      });
    }),
  );

  let drag:
    | {pointer: number; y: number; time: number; moved: number}
    | undefined;

  const settle = (from: number, to: string, done?: () => void) => {
    if (!content) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animation = content.animate(
      [{transform: `translateY(${from}px)`}, {transform: to}],
      {duration: reduce ? 0 : 200, easing: EASE_OUT},
    );
    content.style.transform = '';
    if (done) animation.finished.then(done, done);
  };

  const onGrab = (event: PointerEvent & {currentTarget: HTMLElement}) => {
    if (drag) return;
    drag = {
      pointer: event.pointerId,
      y: event.clientY,
      time: event.timeStamp,
      moved: 0,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDrag = (event: PointerEvent) => {
    if (!content || drag?.pointer !== event.pointerId) return;
    const distance = event.clientY - drag.y;
    drag.moved = distance;
    const offset =
      distance >= 0 ? distance : rubberband(distance, content.offsetHeight);
    content.style.transform = `translateY(${offset}px)`;
  };

  const onRelease = (event: PointerEvent) => {
    if (!content || drag?.pointer !== event.pointerId) return;
    const {moved, time} = drag;
    drag = undefined;
    if (Math.abs(moved) < 4) {
      content.style.transform = '';
      dock.close();
      return;
    }
    const velocity = moved / Math.max(1, event.timeStamp - time);
    const far = moved > content.offsetHeight * 0.35;
    const flicked = moved > 8 && velocity > 0.11;
    if (!far && !flicked) {
      settle(moved, 'translateY(0)');
      return;
    }
    // The slide below already took the sheet away, so the close keyframes are skipped.
    content.dataset.dragged = '';
    content.style.opacity = '0';
    settle(moved, 'translateY(100%)', dock.close);
  };

  return (
    <Dialog
      open={dock.panel() !== undefined}
      onOpenChange={open => {
        if (!open) dock.close();
      }}
      modal={false}
    >
      <div class={styles.sheetSlot} ref={setSlot} />
      {/*
        Kobalte starts its focus handling when the content is created, so the
        content has to be created on open. The portal does that, and it
        mounts into the slot, which keeps the sheet in the layout.
      */}
      <Show when={slot()}>
        {mount => (
          <Dialog.Portal mount={mount()}>
            <Dialog.Content
              ref={(element: HTMLDivElement) => {
                content = element;
              }}
              class={`${styles.sheet} ${sidebarTheme}`}
              aria-label={PANELS[shown() ?? 'more'].title}
              data-panel={shown()}
              onOpenAutoFocus={event => event.preventDefault()}
              onCloseAutoFocus={event => {
                event.preventDefault();
                if (!dismissedOutside) props.trigger()?.focus();
                dismissedOutside = false;
              }}
              onPointerDownOutside={event => {
                if (inBar(event.target)) event.preventDefault();
              }}
              onFocusOutside={event => {
                if (inBar(event.target)) event.preventDefault();
              }}
              onInteractOutside={event => {
                if (!event.defaultPrevented) dismissedOutside = true;
              }}
              on:keydown={closeOnEscape(dock.close)}
            >
              <button
                type="button"
                class={styles.grabber}
                aria-label="Close"
                onPointerDown={onGrab}
                onPointerMove={onDrag}
                onPointerUp={onRelease}
                onPointerCancel={onRelease}
                onClick={event => {
                  if (event.detail === 0) dock.close();
                }}
              />
              <Show when={shown()}>
                {panel => <Dynamic component={PANELS[panel()].Body} />}
              </Show>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </Show>
    </Dialog>
  );
}
