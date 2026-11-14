import {Dialog} from '@kobalte/core/dialog';
import {
  createEffect,
  createMemo,
  createSignal,
  Match,
  on,
  onCleanup,
  Show,
  Switch,
} from 'solid-js';
import {sidebarTheme} from '../../../../components/PropertyEditor/EditorSidebar.css';
import {CommandMenu} from './CommandMenu';
import type {Action} from './commands';
import {keepFromPicker, useDock} from './context';
import type {PanelId} from './fields';
import {
  BackgroundPanel,
  FontPanel,
  LanguagePanel,
  MorePanel,
  PaddingPanel,
  ThemesPanel,
} from './panels';

const TITLES: Record<PanelId, string> = {
  themes: 'Theme',
  background: 'Background',
  padding: 'Padding',
  language: 'Language',
  font: 'Font',
  more: 'More options',
  commands: 'Search themes and options',
};

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

interface TrayProps {
  actions: readonly Action[];
  /** Clicks in here switch or close the tray themselves. */
  bar: () => HTMLElement | undefined;
  /** The element that opened the tray, which gets focus back when it closes. */
  trigger: () => HTMLElement | undefined;
  /** True when the keyboard opened the tray, which then appears without motion. */
  instant: boolean;
}

/**
 * The one surface the dock opens. It is an island in the layout between the
 * canvas and the dock, so the canvas gives up the room and the frame zooms to
 * fit above it. A tray can therefore never lie on the frame it changes.
 */
export function Tray(props: TrayProps) {
  const dock = useDock();
  const [slot, setSlot] = createSignal<HTMLDivElement>();
  let content: HTMLDivElement | undefined;
  let dismissedOutside = false;

  // The sheet keeps its content while it slides out.
  const shown = createMemo<PanelId | undefined>(
    previous => dock.panel() ?? previous,
  );

  // The prototype pickers are harness chrome: switching the theme style
  // there keeps the tray open, so the new style shows in place.
  const inBar = (target: EventTarget | null) =>
    target instanceof Element &&
    (!!props.bar()?.contains(target) ||
      !!target.closest('[data-prototype-chrome]'));

  // A tray narrower than the window sits above the dock item that opened it.
  const align = () => {
    const trigger = props.trigger()?.getBoundingClientRect();
    const area = slot()?.getBoundingClientRect();
    if (!content || !trigger || !area) return;
    const width = content.offsetWidth;
    const centre = trigger.left + trigger.width / 2 - area.left;
    const room = Math.max(area.width - width, 0);
    const offset = Math.round(Math.min(Math.max(centre - width / 2, 0), room));
    content.style.marginLeft = `${offset}px`;
    content.style.transformOrigin = `${centre - offset}px 100%`;
  };

  const resize = new ResizeObserver(align);
  onCleanup(() => resize.disconnect());

  createEffect(
    on(dock.panel, panel => {
      if (!panel) return;
      queueMicrotask(() => {
        align();
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
      <div class="dock-tray-slot" ref={setSlot} />
      {/*
        Kobalte starts its focus handling when the content is created, so the
        content has to be created on open. The portal does that, and it
        mounts into the slot, which keeps the tray in the layout.
      */}
      <Show when={slot()}>
        {mount => (
          <Dialog.Portal mount={mount()}>
            <Dialog.Content
              ref={(element: HTMLDivElement) => {
                content = element;
                resize.observe(element);
                align();
              }}
              class={`dock-tray dock-island ${sidebarTheme}`}
              aria-label={TITLES[shown() ?? 'more']}
              data-panel={shown()}
              data-instant={props.instant ? '' : undefined}
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
              onKeyDown={(event: KeyboardEvent) => {
                const typed =
                  event.key.length === 1 || event.key.startsWith('Arrow');
                if (typed && !event.metaKey && !event.ctrlKey) {
                  keepFromPicker(event);
                }
              }}
            >
              <Show when={dock.compact()}>
                <button
                  type="button"
                  class="dock-grabber"
                  aria-label="Close"
                  onPointerDown={onGrab}
                  onPointerMove={onDrag}
                  onPointerUp={onRelease}
                  onPointerCancel={onRelease}
                  onClick={event => {
                    if (event.detail === 0) dock.close();
                  }}
                />
              </Show>
              <Switch>
                <Match when={shown() === 'themes'}>
                  <ThemesPanel />
                </Match>
                <Match when={shown() === 'background'}>
                  <BackgroundPanel />
                </Match>
                <Match when={shown() === 'padding'}>
                  <PaddingPanel />
                </Match>
                <Match when={shown() === 'language'}>
                  <LanguagePanel />
                </Match>
                <Match when={shown() === 'font'}>
                  <FontPanel />
                </Match>
                <Match when={shown() === 'more'}>
                  <MorePanel />
                </Match>
                <Match when={shown() === 'commands'}>
                  <CommandMenu actions={props.actions} />
                </Match>
              </Switch>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </Show>
    </Dialog>
  );
}
