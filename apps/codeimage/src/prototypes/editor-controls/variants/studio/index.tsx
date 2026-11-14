import {assignInlineVars} from '@vanilla-extract/dynamic';
import clsx from 'clsx';
import {
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {ToolbarSettingsButton} from '../../../../components/Toolbar/ToolbarSettings';
import type {VariantMeta, VariantProps} from '../../contract';
import {CloseIcon, CollapseIcon, PresetsIcon, ShuffleIcon} from './icons';
import type {Panel, PanelId} from './panels';
import {EXPORT_BUTTON_ID, PANELS} from './panels';
import * as styles from './studio.css';

export const meta: VariantMeta = {
  name: 'Studio',
  axis: 'Structure: one named room per area, picked from a rail',
};

type Stop = 'short' | 'tall';

const PANEL_ID = 'studio-panel';
const DRAWER = 'cubic-bezier(0.32, 0.72, 0, 1)';
/** Canvas height kept above the tall stop: 64px under the picker, the rest for the frame. */
const TALL_STOP_GAP = 180;
const FLICK_VELOCITY = 0.11;

function reducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function rubberband(overshoot: number, dimension: number) {
  return (overshoot * dimension * 0.55) / (dimension + 0.55 * overshoot);
}

function Logo() {
  return (
    <svg width="26" height="22" viewBox="0 0 62.31 53.4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M51,0H11.34A11.34,11.34,0,0,0,0,11.34V42.07A11.34,11.34,0,0,0,11.34,53.4H51A11.34,11.34,0,0,0,62.31,42.07V11.34A11.34,11.34,0,0,0,51,0ZM10.47,29.58l5.76-5.75a2.23,2.23,0,0,0,0-3.15l-5.76-5.76a2.23,2.23,0,0,1,0-3.14l1.31-1.31a2.23,2.23,0,0,1,3.14,0L25.13,20.68a2.23,2.23,0,0,1,0,3.15L14.92,34a2.22,2.22,0,0,1-3.14,0l-1.31-1.3A2.25,2.25,0,0,1,10.47,29.58Zm31.81,6H28.93a2.22,2.22,0,0,1-2.23-2.22h0a2.23,2.23,0,0,1,2.23-2.23H42.28a2.22,2.22,0,0,1,2.22,2.23h0A2.21,2.21,0,0,1,42.28,35.6Z"
      />
    </svg>
  );
}

export default function Studio(props: VariantProps) {
  const phoneQuery = matchMedia(styles.PHONE_QUERY);
  const [isPhone, setIsPhone] = createSignal(phoneQuery.matches);
  const [openId, setOpenId] = createSignal<PanelId | null>(
    isPhone() ? null : 'themes',
  );
  const [stop, setStop] = createSignal<Stop>('short');
  const [mainHeight, setMainHeight] = createSignal(0);
  const openers = new Map<PanelId, HTMLElement>();
  let panelEl!: HTMLElement;
  let mainEl!: HTMLElement;

  const openPanel = createMemo(() =>
    PANELS.find(panel => panel.id === openId()),
  );
  const panelById = (id: PanelId) => PANELS.find(panel => panel.id === id)!;

  const sheetHeights = () => {
    const main = mainHeight();
    return {
      short: Math.round(main * 0.5),
      tall: Math.max(Math.round(main * 0.5), main - TALL_STOP_GAP),
    };
  };
  const sheetHeight = () =>
    isPhone() && openId() ? sheetHeights()[stop()] : 0;

  const stopAnimations = () =>
    panelEl.getAnimations().forEach(animation => animation.cancel());

  const slide = (from: string, to: string, duration: number) => {
    stopAnimations();
    return panelEl.animate(
      [{transform: `translateY(${from})`}, {transform: `translateY(${to})`}],
      {duration, easing: DRAWER},
    );
  };

  const [mounted, setMounted] = createSignal<ReadonlySet<PanelId>>(
    new Set(openId() ? [openId()!] : []),
  );

  const open = (panel: Panel) => {
    const wasOpen = openId() !== null;
    setMounted(prev =>
      prev.has(panel.id) ? prev : new Set([...prev, panel.id]),
    );
    setStop(panel.sheet);
    setOpenId(panel.id);
    if (!isPhone() || wasOpen) return;
    stopAnimations();
    if (reducedMotion()) {
      panelEl.animate([{opacity: 0}, {opacity: 1}], {duration: 200});
    } else {
      slide('100%', '0px', 300);
    }
  };

  const close = (returnFocus = false) => {
    const id = openId();
    if (!id) return;
    const done = () => {
      stopAnimations();
      setOpenId(null);
      if (returnFocus) openers.get(id)?.focus();
    };
    if (!isPhone()) return done();
    const exit = reducedMotion()
      ? panelEl.animate([{opacity: 1}, {opacity: 0}], {
          duration: 150,
          fill: 'forwards',
        })
      : panelEl.animate(
          [{transform: 'translateY(0)'}, {transform: 'translateY(100%)'}],
          {duration: 200, easing: DRAWER, fill: 'forwards'},
        );
    exit.onfinish = done;
  };

  const toggle = (panel: Panel) =>
    openId() === panel.id ? close() : open(panel);

  /** Changes stop, then slides from where the sheet was drawn to its new resting place. */
  const settle = (next: Stop, drawnOffset: number) => {
    const heights = sheetHeights();
    const shift = heights[next] - heights[stop()];
    setStop(next);
    if (reducedMotion()) return stopAnimations();
    slide(`${drawnOffset + shift}px`, '0px', 300);
  };

  let drag:
    | {pointer: number; startY: number; y: number; t: number; v: number}
    | undefined;

  const dragOffset = (y: number) => {
    const dy = y - (drag?.startY ?? y);
    const heights = sheetHeights();
    const ceiling = stop() === 'short' ? heights.short - heights.tall : 0;
    return dy >= ceiling
      ? dy
      : ceiling - rubberband(ceiling - dy, heights[stop()]);
  };

  const onGrabStart = (e: PointerEvent) => {
    if (!isPhone() || drag || e.button !== 0) return;
    if ((e.target as Element).closest('button, input, a')) return;
    drag = {
      pointer: e.pointerId,
      startY: e.clientY,
      y: e.clientY,
      t: e.timeStamp,
      v: 0,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    stopAnimations();
  };

  const onGrabMove = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    const dt = Math.max(1, e.timeStamp - drag.t);
    drag.v = 0.8 * ((e.clientY - drag.y) / dt) + 0.2 * drag.v;
    drag.y = e.clientY;
    drag.t = e.timeStamp;
    panelEl.style.transform = `translateY(${dragOffset(e.clientY)}px)`;
  };

  const onGrabEnd = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    const offset = dragOffset(e.clientY);
    const velocity = drag.v;
    const moved = Math.abs(e.clientY - drag.startY) > 6;
    drag = undefined;
    panelEl.style.transform = '';

    if (!moved) return settle(stop() === 'short' ? 'tall' : 'short', 0);

    const heights = sheetHeights();
    const current = heights[stop()];
    const snaps: {target: Stop | 'closed'; at: number}[] = [
      {target: 'tall', at: current - heights.tall},
      {target: 'short', at: current - heights.short},
      {target: 'closed', at: current},
    ];
    const flick = Math.abs(velocity) > FLICK_VELOCITY;
    const projected = offset + (flick ? velocity * 200 : 0);
    const nearest = snaps.reduce((best, snap) =>
      Math.abs(snap.at - projected) < Math.abs(best.at - projected)
        ? snap
        : best,
    );

    if (nearest.target === 'closed') {
      if (reducedMotion()) return close();
      const exit = panelEl.animate(
        [
          {transform: `translateY(${offset}px)`},
          {transform: 'translateY(100%)'},
        ],
        {duration: 200, easing: DRAWER, fill: 'forwards'},
      );
      exit.onfinish = () => {
        stopAnimations();
        setOpenId(null);
      };
      return;
    }
    settle(nearest.target, offset);
  };

  const onPanelKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    e.stopPropagation();
    close(true);
  };

  onMount(() => {
    const onQuery = (e: MediaQueryListEvent) => setIsPhone(e.matches);
    phoneQuery.addEventListener('change', onQuery);

    const observer = new ResizeObserver(([entry]) =>
      setMainHeight(entry.contentRect.height),
    );
    observer.observe(mainEl);

    const onSave = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 's') return;
      e.preventDefault();
      const exportPanel = PANELS.find(panel => panel.id === 'export');
      if (exportPanel && openId() !== 'export') open(exportPanel);
      requestAnimationFrame(() =>
        document.getElementById(EXPORT_BUTTON_ID)?.focus(),
      );
    };
    document.addEventListener('keydown', onSave);

    onCleanup(() => {
      phoneQuery.removeEventListener('change', onQuery);
      observer.disconnect();
      document.removeEventListener('keydown', onSave);
    });
  });

  const opener = (panel: Panel) => (
    <button
      ref={el => openers.set(panel.id, el)}
      type="button"
      class={styles.railButton}
      data-phone={panel.phone}
      aria-controls={PANEL_ID}
      aria-expanded={openId() === panel.id}
      data-owns-open={openPanel()?.phone === panel.id ? '' : undefined}
      onClick={() => toggle(panel)}
    >
      <span class={styles.railIcon}>
        <panel.Icon />
      </span>
      {panel.label}
    </button>
  );

  return (
    <div
      class={styles.root}
      style={assignInlineVars({[styles.sheetHeight]: `${sheetHeight()}px`})}
    >
      <nav class={styles.rail} aria-label="Editor panels">
        <div class={styles.railLogo}>
          <Logo />
        </div>
        <For each={PANELS}>{opener}</For>
        <div class={styles.railSpacer} />
        <div class={styles.railFooter}>
          <ToolbarSettingsButton />
        </div>
      </nav>

      <section
        ref={panelEl}
        id={PANEL_ID}
        role="region"
        aria-label={openPanel()?.label}
        class={styles.panel}
        data-wide={openPanel()?.wide ? '' : undefined}
        hidden={!openPanel()}
        onKeyDown={onPanelKeyDown}
      >
        <div
          class={styles.panelGrabArea}
          onPointerDown={onGrabStart}
          onPointerMove={onGrabMove}
          onPointerUp={onGrabEnd}
          onPointerCancel={onGrabEnd}
        >
          <div class={styles.sheetGrip} />
          <Show when={!openPanel()?.ownHeader}>
            <div class={styles.panelHeader}>
              <h2 class={styles.panelTitle}>{openPanel()?.label}</h2>
              <Show when={openId() === 'themes'}>
                <button
                  type="button"
                  class={clsx(styles.button, styles.phoneOnlyFlex)}
                  onClick={() => open(panelById('presets'))}
                >
                  <PresetsIcon size={16} />
                  Presets
                </button>
                <button
                  type="button"
                  class={styles.iconButton}
                  aria-label="Random theme"
                  title="Random theme"
                  onClick={() => props.stage.randomize()}
                >
                  <ShuffleIcon size={18} />
                </button>
              </Show>
              <Show when={openId() === 'export'}>
                <span class={styles.phoneOnlyFlex}>
                  <ToolbarSettingsButton />
                </span>
              </Show>
              <button
                type="button"
                class={styles.iconButton}
                aria-label={`Close ${openPanel()?.label ?? 'panel'}`}
                title="Close (Esc)"
                onClick={() => close(true)}
              >
                <span class={styles.desktopOnly}>
                  <CollapseIcon size={18} />
                </span>
                <span class={styles.phoneOnly}>
                  <CloseIcon size={18} />
                </span>
              </button>
            </div>
          </Show>
        </div>
        <For each={PANELS}>
          {panel => (
            <Show when={mounted().has(panel.id)}>
              <div class={styles.panelPage} hidden={openId() !== panel.id}>
                <Dynamic
                  component={panel.Body}
                  model={props.model}
                  stage={props.stage}
                  close={() => close(true)}
                />
              </div>
            </Show>
          )}
        </For>
      </section>

      <main ref={mainEl} class={styles.main}>
        <div class={styles.canvas}>
          <props.stage.Canvas />
        </div>
      </main>
    </div>
  );
}
