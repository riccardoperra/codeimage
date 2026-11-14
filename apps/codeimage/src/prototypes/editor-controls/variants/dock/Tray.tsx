import {Dialog} from '@kobalte/core/dialog';
import {createEffect, createMemo, Match, on, Show, Switch} from 'solid-js';
import {CommandMenu} from './CommandMenu';
import type {Action} from './commands';
import {keepFromPicker, useDock} from './context';
import type {PanelId, View} from './fields';
import {
  BackgroundPanel,
  DetailPanel,
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
  bar: () => HTMLElement | undefined;
  /** The element that opened the tray, which gets focus back when it closes. */
  trigger: () => HTMLElement | undefined;
  /** True when the keyboard opened the tray, which then appears without motion. */
  instant: boolean;
}

/**
 * The one surface every dock item opens. It sits in the layout between the
 * canvas and the dock, so the canvas gives up the room and the frame zooms to
 * fit above it. A tray can therefore never lie on the frame it changes.
 */
export function Tray(props: TrayProps) {
  const dock = useDock();
  let content: HTMLDivElement | undefined;
  let dismissedOutside = false;

  // The sheet keeps its content while it slides out.
  const shown = createMemo<View | undefined>(
    previous => dock.view() ?? previous,
  );

  const inBar = (target: EventTarget | null) =>
    target instanceof Node && !!props.bar()?.contains(target);

  createEffect(
    on(dock.view, view => {
      if (!view) return;
      queueMicrotask(() => {
        if (!content || content.contains(document.activeElement)) return;
        (content.querySelector<HTMLElement>(FOCUSABLE) ?? content).focus();
      });
    }),
  );

  const setOrigin = (element: HTMLDivElement) => {
    content = element;
    const trigger = props.trigger()?.getBoundingClientRect();
    if (!trigger) return;
    const tray = element.getBoundingClientRect();
    const x = trigger.left + trigger.width / 2 - tray.left;
    element.style.transformOrigin = `${x}px 100%`;
  };

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
      open={dock.view() !== undefined}
      onOpenChange={open => {
        if (!open) dock.close();
      }}
      modal={false}
    >
      <div class="dock-tray-slot">
        <Dialog.Content
          ref={setOrigin}
          class="dock-tray"
          aria-label={TITLES[shown()?.panel ?? 'more']}
          data-panel={shown()?.panel}
          data-detail={shown()?.detail}
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
          onEscapeKeyDown={(event: KeyboardEvent) => {
            if (!dock.view()?.detail) return;
            event.preventDefault();
            dock.back();
          }}
          onKeyDown={(event: KeyboardEvent) => {
            const typed =
              event.key.length === 1 || event.key.startsWith('Arrow');
            if (typed && !event.metaKey && !event.ctrlKey)
              keepFromPicker(event);
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
          <Show when={shown()} keyed>
            {view => (
              <Show
                when={view.detail}
                fallback={
                  <Switch>
                    <Match when={view.panel === 'themes'}>
                      <ThemesPanel />
                    </Match>
                    <Match when={view.panel === 'background'}>
                      <BackgroundPanel />
                    </Match>
                    <Match when={view.panel === 'padding'}>
                      <PaddingPanel />
                    </Match>
                    <Match when={view.panel === 'language'}>
                      <LanguagePanel />
                    </Match>
                    <Match when={view.panel === 'font'}>
                      <FontPanel />
                    </Match>
                    <Match when={view.panel === 'more'}>
                      <MorePanel />
                    </Match>
                    <Match when={view.panel === 'commands'}>
                      <CommandMenu actions={props.actions} />
                    </Match>
                  </Switch>
                }
              >
                {detail => <DetailPanel detail={detail()} />}
              </Show>
            )}
          </Show>
        </Dialog.Content>
      </div>
    </Dialog>
  );
}
