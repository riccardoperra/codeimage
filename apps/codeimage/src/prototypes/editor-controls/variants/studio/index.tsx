import {useI18n} from '@codeimage/locale';
import {signatureEditor} from '@codeimage/store/frame/signatureEditor';
import {Button, IconButton} from '@codeui/kit';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {ColorSwatchIcon} from '../../../../components/Icons/ColorSwatch';
import {SparklesIcon} from '../../../../components/Icons/SparklesIcon';
import {ShareButton} from '../../../../components/Toolbar/ShareButton';
import type {AppLocaleEntries} from '../../../../i18n';
import {CommandMenuButton} from '../../command-menu/CommandMenuButton';
import {commandMenu} from '../../command-menu/state';
import type {VariantMeta, VariantProps} from '../../contract';
import {controlOverlay} from '../../controls/ControlOverlay';
import {FrameActions} from '../../controls/FrameActions';
import {keepMarkToolbarAboveSelection} from '../../controls/mark-toolbar';
import {ShortcutHelp} from '../../controls/ShortcutHelp';
import {Footer} from '../../localized/Footer';
import {SettingsIcon} from '../../shell/icons';
import {claimSettingsEntry, settings} from '../../shell/settings-state';
import {ownCompositeKeys} from './controls';
import {CloseIcon, CollapseIcon, SearchIcon} from './icons';
import {PANELS} from './panels';
import type {Panel, PanelId} from './panels';
import * as styles from './studio.css';

export const meta: VariantMeta = {
  name: 'editor.studio',
  axis: 'Structure: one named room per area, picked from a rail',
};

type Stop = 'short' | 'tall';

const PANEL_ID = 'studio-panel';
const DRAWER = 'cubic-bezier(0.32, 0.72, 0, 1)';
const GAP = 8;
/** Canvas island height kept above the tall stop, so the frame stays in view. */
const TALL_STOP_CANVAS = 220;
const FLICK_VELOCITY = 0.11;

function reducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function rubberband(overshoot: number, dimension: number) {
  return (overshoot * dimension * 0.55) / (dimension + 0.55 * overshoot);
}

/** The settings entry at the foot of the rail, under Search. */
function RailSettings() {
  const [t] = useI18n<AppLocaleEntries>();
  claimSettingsEntry();
  return (
    <button
      type="button"
      class={styles.railButton}
      aria-haspopup="dialog"
      aria-expanded={settings.isOpen()}
      data-settings-trigger
      onClick={() => settings.open()}
    >
      <span class={styles.railIcon}>
        <SettingsIcon size={20} />
      </span>
      {t('editor.settings')}
    </button>
  );
}

export default function Studio(props: VariantProps) {
  const [t] = useI18n<AppLocaleEntries>();
  keepMarkToolbarAboveSelection();
  const compactQuery = matchMedia(styles.COMPACT_QUERY);
  const [isPhone, setIsPhone] = createSignal(compactQuery.matches);
  const [openId, setOpenId] = createSignal<PanelId | null>(
    isPhone() ? null : 'themes',
  );
  const [mounted, setMounted] = createSignal<ReadonlySet<PanelId>>(
    new Set(openId() ? [openId()!] : []),
  );
  const [stop, setStop] = createSignal<Stop>('short');
  const [available, setAvailable] = createSignal(0);
  const openers = new Map<PanelId, HTMLElement>();
  const size = () => (isPhone() ? 'md' : 'sm');
  let panelEl!: HTMLElement;
  let bodyEl!: HTMLDivElement;
  let railEl!: HTMLElement;

  const openPanel = createMemo(() =>
    PANELS.find(panel => panel.id === openId()),
  );

  const sheetHeights = () => ({
    short: Math.round(available() * 0.5),
    tall: Math.max(
      Math.round(available() * 0.5),
      available() - TALL_STOP_CANVAS,
    ),
  });
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

  const open = (panel: Panel) => {
    const wasOpen = openId() !== null;
    setMounted(prev =>
      prev.has(panel.id) ? prev : new Set([...prev, panel.id]),
    );
    setStop(panel.sheet ?? 'short');
    setOpenId(panel.id);
    if (!isPhone() || wasOpen) return;
    stopAnimations();
    if (reducedMotion()) {
      panelEl.animate([{opacity: 0}, {opacity: 1}], {duration: 200});
    } else {
      slide('110%', '0px', 300);
    }
  };

  const finishClose = (id: PanelId, returnFocus: boolean) => {
    stopAnimations();
    setOpenId(null);
    if (returnFocus) openers.get(id)?.focus();
  };

  const close = (returnFocus = false) => {
    const id = openId();
    if (!id) return;
    if (!isPhone()) return finishClose(id, returnFocus);
    const exit = reducedMotion()
      ? panelEl.animate([{opacity: 1}, {opacity: 0}], {
          duration: 150,
          fill: 'forwards',
        })
      : panelEl.animate(
          [{transform: 'translateY(0)'}, {transform: 'translateY(110%)'}],
          {duration: 200, easing: DRAWER, fill: 'forwards'},
        );
    exit.onfinish = () => finishClose(id, returnFocus);
  };

  onMount(() => {
    onCleanup(
      props.model.controls.register(id => {
        const group = id.split('.')[0];
        const panel = PANELS.find(
          panel =>
            panel.id ===
            (group === 'signature'
              ? 'frame'
              : group === 'editor' || group === 'font'
                ? 'code'
                : group),
        );
        if (panel) open(panel);
        setStop('tall');
        if (group === 'signature') controlOverlay.open('signature');
      }),
    );
  });
  // Canvas clicks and the Frame row share the same signature editor.
  onCleanup(signatureEditor.register(() => controlOverlay.open('signature')));

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
      const id = openId();
      if (!id || reducedMotion()) return close();
      const exit = panelEl.animate(
        [
          {transform: `translateY(${offset}px)`},
          {transform: 'translateY(110%)'},
        ],
        {duration: 200, easing: DRAWER, fill: 'forwards'},
      );
      exit.onfinish = () => finishClose(id, false);
      return;
    }
    settle(nearest.target, offset);
  };

  const onPanelKeyDown = (e: KeyboardEvent) => {
    ownCompositeKeys(e);
    if (e.key !== 'Escape' || e.defaultPrevented || e.cancelBubble) return;
    e.stopPropagation();
    close(true);
  };

  onMount(() => {
    const onQuery = (e: MediaQueryListEvent) => setIsPhone(e.matches);
    compactQuery.addEventListener('change', onQuery);

    const measure = () =>
      setAvailable(
        railEl.getBoundingClientRect().top -
          bodyEl.getBoundingClientRect().top -
          GAP,
      );
    const observer = new ResizeObserver(measure);
    observer.observe(bodyEl);
    measure();

    onCleanup(() => {
      compactQuery.removeEventListener('change', onQuery);
      observer.disconnect();
    });
  });

  return (
    <div class={styles.root}>
      <div
        ref={bodyEl}
        class={styles.body}
        style={assignInlineVars({
          [styles.sheetHeight]: `${sheetHeight()}px`,
          [styles.sheetSpace]: `${sheetHeight() ? sheetHeight() + GAP : 0}px`,
        })}
      >
        <nav
          ref={railEl}
          class={styles.rail}
          aria-label={t('editor.editorPanels')}
        >
          <For each={PANELS}>
            {panel => (
              <button
                ref={el => openers.set(panel.id, el)}
                type="button"
                class={styles.railButton}
                aria-controls={PANEL_ID}
                aria-expanded={openId() === panel.id}
                onClick={() => toggle(panel)}
              >
                <span class={styles.railIcon}>
                  <panel.Icon />
                </span>
                {t(panel.label)}
              </button>
            )}
          </For>
          <Show when={!isPhone()}>
            <CommandMenuButton>
              {trigger => (
                <button
                  {...trigger}
                  type="button"
                  class={`${styles.railButton} ${styles.railSearch}`}
                  title={`${t('editor.searchOptions')} (${commandMenu.shortcut})`}
                >
                  <span class={styles.railIcon}>
                    <SearchIcon />
                  </span>
                  {t('editor.search')}
                  <kbd class={styles.railHint}>{commandMenu.shortcut}</kbd>
                </button>
              )}
            </CommandMenuButton>
            <RailSettings />
          </Show>
          <ShortcutHelp />
        </nav>

        <section
          ref={panelEl}
          data-control-panel
          id={PANEL_ID}
          role="region"
          aria-label={openPanel() ? t(openPanel()!.label) : undefined}
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
                <h2 class={styles.panelTitle}>
                  {openPanel() ? t(openPanel()!.label) : ''}
                </h2>
                <IconButton
                  size={size()}
                  theme="secondary"
                  variant="ghost"
                  aria-label={t('editor.closePanel', {
                    panel: openPanel()
                      ? t(openPanel()!.label)
                      : t('editor.panel'),
                  })}
                  title={t('editor.closeEscape')}
                  onClick={() => close(true)}
                >
                  <Show when={isPhone()} fallback={<CollapseIcon size={18} />}>
                    <CloseIcon size={18} />
                  </Show>
                </IconButton>
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
                    ThemePicker={props.ThemePicker}
                    size={size}
                    phone={isPhone}
                    close={() => close(true)}
                  />
                </div>
              </Show>
            )}
          </For>
        </section>

        <main class={styles.main}>
          <div class={styles.stage}>
            <props.stage.Canvas />
          </div>
          <Show
            when={!props.stage.compact()}
            fallback={
              <div class={styles.compactActions}>
                <ShareButton showLabel={false} />
                <Button
                  size="xs"
                  theme="secondary"
                  aria-label={t('shortcut.pickRandomTheme')}
                  leftIcon={<ColorSwatchIcon />}
                  onClick={() => props.stage.randomize()}
                />
                <Button
                  size="xs"
                  theme="secondary"
                  aria-label={t('editor.formatCode')}
                  leftIcon={<SparklesIcon />}
                  disabled={!props.stage.canFormat()}
                  onClick={() => props.stage.format()}
                />
                <props.stage.ExportButton />
              </div>
            }
          >
            <div class={styles.frameActions}>
              <FrameActions />
            </div>
            <div class={styles.footer}>
              <Footer />
            </div>
          </Show>
        </main>
      </div>
    </div>
  );
}
