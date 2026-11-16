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
import {SparklesIcon} from '../../../../components/Icons/SparklesIcon';
import {ShareButton} from '../../../../components/Toolbar/ShareButton';
import type {AppLocaleEntries} from '../../../../i18n';
import {EditingControls} from '../../EditingControls';
import {CommandMenuButton} from '../../command-menu/CommandMenuButton';
import {commandMenu} from '../../command-menu/state';
import type {VariantProps} from '../../contract';
import {controlOverlay} from '../../controls/ControlOverlay';
import {CanvasToolbar} from '../../controls/CanvasToolbar';
import {keepMarkToolbarAboveSelection} from '../../controls/mark-toolbar';
import {ShortcutHelp} from '../../controls/ShortcutHelp';
import {ExperimentsIcon, SettingsIcon, GitHubIcon} from '../../shell/icons';
import {editorLinks} from '../../shell/links';
import {settings} from '../../shell/settings-state';
import {claimHeaderActions} from '../../shell/header-actions';
import {ownCompositeKeys} from './controls';
import {CloseIcon, CollapseIcon, SearchIcon} from './icons';
import {PANELS} from './panels';
import {PLACES} from './places';
import type {Panel, PanelId} from './panels';
import * as styles from './rail.css';
import {createOverlayPlacement} from './overlays';
import {preferences} from '../../shell/preferences';

type Stop = 'short' | 'tall';

const PANEL_ID = 'sidebar-panel';
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

/** Layout-hosted header actions, followed by the repository link. */
function RailActions() {
  const [t] = useI18n<AppLocaleEntries>();
  claimHeaderActions(['commands', 'settings', 'experiments']);
  return (
    <>
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
      <button
        type="button"
        class={`${styles.railButton} ${styles.railLink}`}
        aria-label={t('editor.experiments')}
        title={t('editor.experiments')}
        aria-haspopup="dialog"
        data-experiments-trigger
        onClick={() => settings.open('experiments')}
      >
        <span class={styles.railIcon}>
          <ExperimentsIcon size={20} />
        </span>
      </button>
      <a
        class={`${styles.railButton} ${styles.railLink}`}
        href={editorLinks[0].href}
        target="_blank"
        rel="noreferrer"
        aria-label={t('editor.openGithub')}
        title={t('editor.openGithub')}
      >
        <GitHubIcon size={20} />
      </a>
    </>
  );
}

/** The sidebar as a rail of areas, each opening its panel beside the canvas. */
export function Rail(props: VariantProps) {
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
  let mainEl!: HTMLElement;
  createOverlayPlacement(
    () => panelEl,
    () => mainEl,
  );

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
    isPhone() && openId() && props.pageState().kind !== 'read-only'
      ? sheetHeights()[stop()]
      : 0;

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
        const place = PLACES[id];
        const panel = PANELS.find(panel => panel.id === place.panel);
        if (panel) open(panel);
        setStop('tall');
        if (place.group === 'signature') controlOverlay.open('signature');
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

    const measure = () => {
      if (!railEl?.isConnected) return;
      setAvailable(
        railEl.getBoundingClientRect().top -
          bodyEl.getBoundingClientRect().top -
          GAP,
      );
    };
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
        data-side={isPhone() ? undefined : preferences.panelSide()}
        data-read-only={props.pageState().kind === 'read-only' ? '' : undefined}
        style={assignInlineVars({
          [styles.sheetHeight]: `${sheetHeight()}px`,
          [styles.sheetSpace]: `${sheetHeight() ? sheetHeight() + GAP : 0}px`,
        })}
      >
        <Show when={!isPhone() || props.pageState().kind !== 'read-only'}>
          <nav
            ref={railEl}
            class={styles.rail}
            aria-label={t('editor.editorPanels')}
          >
            <EditingControls state={props.pageState()}>
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
            </EditingControls>
            <Show when={!isPhone()}>
              <div class={styles.railUtilities}>
                <CommandMenuButton>
                  {trigger => (
                    <button
                      {...trigger}
                      type="button"
                      class={styles.railButton}
                      title={`${t('editor.searchOptions')} (${commandMenu.shortcut})`}
                    >
                      <span class={styles.railIcon}>
                        <SearchIcon />
                      </span>
                      {t('editor.commands')}
                      <kbd class={styles.railHint}>{commandMenu.shortcut}</kbd>
                    </button>
                  )}
                </CommandMenuButton>
                <RailActions />
              </div>
            </Show>
            <Show when={isPhone()}>
              <EditingControls state={props.pageState()}>
                <ShortcutHelp editable={props.pageState().editable} />
              </EditingControls>
            </Show>
          </nav>
        </Show>

        <EditingControls state={props.pageState()}>
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
            </div>
            <For each={PANELS}>
              {panel => (
                <Show when={mounted().has(panel.id)}>
                  <div class={styles.panelPage} hidden={openId() !== panel.id}>
                    <Dynamic
                      component={panel.Body}
                      model={props.model}
                      pageState={props.pageState}
                      stage={props.stage}
                      ThemePicker={props.ThemePicker}
                      size={size}
                      phone={isPhone}
                    />
                  </div>
                </Show>
              )}
            </For>
          </section>
        </EditingControls>

        <main ref={mainEl} class={styles.main}>
          <div class={styles.stage}>
            <props.stage.Canvas />
          </div>
          <EditingControls state={props.pageState()}>
            <props.stage.AnimatePanel />
          </EditingControls>
          <Show
            when={!props.stage.compact()}
            fallback={
              <div class={styles.compactActions}>
                <EditingControls state={props.pageState()}>
                  <props.stage.AnimateToggle iconOnly />
                </EditingControls>
                <Show when={props.pageState().kind === 'local'}>
                  <ShareButton showLabel={false} />
                </Show>
                <EditingControls state={props.pageState()}>
                  <Button
                    size="xs"
                    theme="secondary"
                    aria-label={t('editor.formatCode')}
                    leftIcon={<SparklesIcon />}
                    disabled={!props.stage.canFormat()}
                    onClick={() => props.stage.format()}
                  />
                </EditingControls>
                <props.stage.ExportButton />
              </div>
            }
          >
            <EditingControls state={props.pageState()}>
              <div class={styles.frameActions}>
                <CanvasToolbar stage={props.stage} />
              </div>
            </EditingControls>
          </Show>
        </main>
      </div>
    </div>
  );
}
