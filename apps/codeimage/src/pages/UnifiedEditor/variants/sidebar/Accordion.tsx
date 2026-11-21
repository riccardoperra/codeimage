import {getEditorStore} from '@codeimage/store/editor';
import {useI18n} from '@codeimage/locale';
import {signatureEditor} from '@codeimage/store/frame/signatureEditor';
import {Button} from '@codeui/kit';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {
  For,
  Show,
  createEffect,
  createSignal,
  onCleanup,
  onSettled,
  untrack,
} from 'solid-js';
import type {JSX} from '@solidjs/web';
import type {ParentProps} from 'solid-js';
import {Dynamic} from '@solidjs/web';
import type {AppLocaleEntries} from '../../../../i18n';
import {EditingControls} from '../../EditingControls';
import type {VariantProps} from '../../contract';
import {controlOverlay} from '../../controls/ControlOverlay';
import {CanvasToolbar} from '../../controls/CanvasToolbar';
import {ShortcutHelp} from '../../controls/ShortcutHelp';
import type {ControlId} from '../../model';
import * as styles from './accordion.css';
import {createOverlayPlacement} from './overlays';
import {createResizeRef} from '@core/hooks/create-resize-ref';
import {PANELS} from './panels';
import type {PanelId} from './panels';
import {PLACES} from './places';

// Solid routes delegated events from a portal to its owner, so the Escape that
// closes an overlay would also reach the section around its trigger.
const fromPortal = (event: KeyboardEvent) =>
  !(event.currentTarget as Node).contains(event.target as Node);

// The arrow keys, Home and End move between the section headers.
function moveBetweenHeaders(event: KeyboardEvent) {
  const headers = [
    ...(event.currentTarget as HTMLElement)
      .closest(`.${styles.panelScroll}`)!
      .querySelectorAll<HTMLElement>(`:scope > .${styles.section} > button`),
  ];
  const index = headers.indexOf(event.currentTarget as HTMLElement);
  const next = {
    ArrowDown: headers[(index + 1) % headers.length],
    ArrowUp: headers[(index - 1 + headers.length) % headers.length],
    Home: headers[0],
    End: headers[headers.length - 1],
  }[event.key];
  if (!next) return;
  event.preventDefault();
  next.focus();
}

/**
 * A section of the accordion. Its body animates between 0 and the height its
 * content measures, or the height the panel leaves for the theme picker, so
 * a second click retargets from wherever the first one got to.
 */
function Section(
  props: ParentProps<{
    id: string;
    title: string;
    icon: JSX.Element;
    summary?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** A fixed open height, in place of the content's own. */
    height?: number;
  }>,
) {
  let trigger: HTMLButtonElement | undefined;
  const [measured, setMeasured] = createSignal(0);
  const measureSection = createResizeRef(element =>
    setMeasured(element.offsetHeight),
  );
  const header = () => `sidebar-section-${props.id}`;
  return (
    <section
      class={styles.section}
      data-section={props.id}
      data-open={props.open ? '' : undefined}
      onKeyDown={event => {
        if (event.key !== 'Escape' || !props.open || fromPortal(event)) return;
        event.stopPropagation();
        props.onOpenChange(false);
        trigger?.focus();
      }}
    >
      <button
        type="button"
        id={header()}
        class={styles.sectionTrigger}
        aria-expanded={props.open ? 'true' : 'false'}
        aria-controls={`${header()}-body`}
        onClick={() => props.onOpenChange(!props.open)}
        onKeyDown={moveBetweenHeaders}
        ref={element => {
          trigger = element;
        }}
      >
        <span class={styles.sectionIcon}>{props.icon}</span>
        <span class={styles.sectionName}>{props.title}</span>
        <span class={styles.summary} title={props.summary}>
          {props.summary}
        </span>
        <span class={styles.chevron} aria-hidden="true">
          ›
        </span>
      </button>
      <div
        id={`${header()}-body`}
        class={styles.sectionBody}
        role="region"
        aria-labelledby={header()}
        inert={!props.open}
        style={assignInlineVars({
          [styles.bodyHeight]: `${props.height ?? measured()}px`,
        })}
      >
        <div class={styles.sectionContent} ref={measureSection}>
          {props.children}
        </div>
      </div>
    </section>
  );
}

/** The sidebar as one panel of sections, one open at a time. */
export function Accordion(props: VariantProps) {
  const [t] = useI18n<AppLocaleEntries>();
  // One section at a time. All may be closed, which leaves the summaries.
  const [openSection, setOpenSection] = createSignal<PanelId | null>('themes');
  const {animation} = getEditorStore();
  const [sheet, setSheet] = createSignal<'short' | 'tall'>('short');
  createEffect(animation.open, open => {
    if (open) setSheet('short');
  });
  // How far down the page the layout ends, which sets how tall the sheet
  // may grow. The page's header is above the root.
  const [rootHeight, setRootHeight] = createSignal(innerHeight);
  const tallSheet = () => Math.min(560, rootHeight() - 284);
  const mobile = () => props.stage.compact();
  let panel: HTMLElement | undefined;
  let canvas: HTMLElement | undefined;
  let scroll: HTMLDivElement | undefined;
  // The open theme section takes what the closed headers leave of the panel.
  const [fill, setFill] = createSignal(360);
  const measureFill = () => {
    if (!scroll) return;
    const box = getComputedStyle(scroll);
    const inner =
      scroll.clientHeight -
      parseFloat(box.paddingTop) -
      parseFloat(box.paddingBottom);
    const sections = [
      ...scroll.querySelectorAll<HTMLElement>(`:scope > .${styles.section}`),
    ];
    // A section without its body: the header and the island's padding.
    const chrome = sections.reduce((sum, section) => {
      const body = section.querySelector<HTMLElement>(
        `:scope > .${styles.sectionBody}`,
      );
      return sum + section.offsetHeight - (body?.offsetHeight ?? 0);
    }, 0);
    const gaps = (parseFloat(box.rowGap) || 0) * (sections.length - 1);
    setFill(Math.max(mobile() ? 436 : 360, Math.floor(inner - chrome - gaps)));
  };
  const measureRoot = createResizeRef(element =>
    setRootHeight(element.getBoundingClientRect().bottom),
  );
  const observeScroll = createResizeRef(() => measureFill());
  const measureScroll = (element: HTMLDivElement) => {
    scroll = element;
    observeScroll(element);
  };
  let handle: HTMLButtonElement | undefined;
  createOverlayPlacement(
    () => panel,
    () => canvas,
  );
  let drag:
    | {pointerId: number; startY: number; height: number; time: number}
    | undefined;
  let skipHandleClick = false;
  // An open section changes the island padding the theme section leaves room for.
  createEffect(
    () => [openSection(), mobile()] as const,
    () => queueMicrotask(() => untrack(measureFill)),
  );
  const size = () => (mobile() ? 'md' : 'sm');
  const toggleSection = (id: PanelId, open: boolean) =>
    setOpenSection(current => (open ? id : current === id ? null : current));
  const openQuickControl = (id: PanelId, controlId?: ControlId) => {
    setSheet('tall');
    toggleSection(id, true);
    queueMicrotask(() => {
      const target = controlId
        ? panel?.querySelector<HTMLElement>(`[data-control="${controlId}"]`)
        : panel?.querySelector<HTMLElement>(`[data-section="${id}"]`);
      target?.scrollIntoView({block: 'start'});
      target
        ?.querySelector<HTMLElement>('input, button')
        ?.focus({preventScroll: true});
    });
  };
  onSettled(() => {
    return untrack(() => props.model).controls.register(id => {
      const place = PLACES[id];
      if (place.group !== 'signature') return openQuickControl(place.panel, id);
      setSheet('tall');
      toggleSection(place.panel, true);
      controlOverlay.open('signature');
    });
  });
  // A click on the signature in the canvas opens its section at the handle.
  onCleanup(signatureEditor.register(() => controlOverlay.open('signature')));
  return (
    <div
      class={styles.root}
      data-sheet={sheet()}
      style={assignInlineVars({[styles.tallSheet]: `${tallSheet()}px`})}
      ref={measureRoot}
    >
      <div class={styles.workspace}>
        <main
          class={styles.canvas}
          aria-label={t('editor.imagePreview')}
          ref={element => {
            canvas = element;
          }}
          onPointerDown={() => {
            if (mobile() && sheet() === 'tall') setSheet('short');
          }}
        >
          <div class={styles.stage}>
            <props.stage.Canvas />
          </div>
          <EditingControls state={props.pageState()}>
            <props.stage.AnimatePanel />
          </EditingControls>
          <Show
            when={
              props.pageState().kind !== 'read-only' || props.stage.compact()
            }
          >
            <div class={styles.frameActions}>
              <EditingControls state={props.pageState()}>
                <CanvasToolbar stage={props.stage} />
              </EditingControls>
              <Show when={props.stage.compact()}>
                <props.stage.ExportButton />
              </Show>
            </div>
          </Show>
        </main>
        <EditingControls state={props.pageState()}>
          <aside
            class={styles.panel}
            data-control-panel
            aria-label={t('editor.imageInspector')}
            ref={element => {
              panel = element;
            }}
          >
            <Button
              class={styles.sheetHandle}
              size="sm"
              variant="secondary"
              ghost
              aria-label={
                sheet() === 'short'
                  ? t('editor.expandInspector')
                  : t('editor.collapseInspector')
              }
              aria-expanded={sheet() === 'tall' ? 'true' : 'false'}
              ref={element => {
                handle = element;
              }}
              onPointerDown={(
                event: PointerEvent & {currentTarget: HTMLButtonElement},
              ) => {
                if (!event.isPrimary || event.button !== 0 || !panel) return;
                drag = {
                  pointerId: event.pointerId,
                  startY: event.clientY,
                  height: panel.clientHeight,
                  time: event.timeStamp,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event: PointerEvent) => {
                if (!drag || event.pointerId !== drag.pointerId || !panel)
                  return;
                const distance = drag.startY - event.clientY;
                if (Math.abs(distance) < 8 && !skipHandleClick) return;
                skipHandleClick = true;
                panel.style.height = `${Math.max(92, Math.min(tallSheet(), drag.height + distance))}px`;
                setSheet('tall');
              }}
              onPointerUp={(event: PointerEvent) => {
                if (!drag || event.pointerId !== drag.pointerId || !panel)
                  return;
                if (skipHandleClick) {
                  const velocity =
                    (drag.startY - event.clientY) /
                    Math.max(1, event.timeStamp - drag.time);
                  setSheet(
                    Math.abs(velocity) > 0.11
                      ? velocity > 0
                        ? 'tall'
                        : 'short'
                      : panel.clientHeight > (92 + tallSheet()) / 2
                        ? 'tall'
                        : 'short',
                  );
                }
                panel.style.height = '';
                drag = undefined;
              }}
              onPointerCancel={() => {
                drag = undefined;
                skipHandleClick = false;
                if (panel) panel.style.height = '';
              }}
              onClick={() => {
                if (skipHandleClick) {
                  skipHandleClick = false;
                  return;
                }
                setSheet(current => (current === 'short' ? 'tall' : 'short'));
              }}
            >
              <span class={styles.sheetGrip} />
            </Button>
            <div class={styles.quickControls}>
              <Show when={mobile()}>
                <ShortcutHelp editable={props.pageState().editable} />
              </Show>
              <Button
                variant="secondary"
                size="sm"
                ghost
                onClick={() => openQuickControl('themes')}
              >
                {t('frame.theme')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                ghost
                onClick={() => openQuickControl('frame', 'frame.background')}
              >
                {t('frame.background')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                ghost
                onClick={() => openQuickControl('frame', 'frame.padding')}
              >
                {t('frame.padding')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                ghost
                onClick={() => openQuickControl('code', 'editor.language')}
              >
                {t('frame.language')}
              </Button>
            </div>
            <div
              class={styles.panelScroll}
              ref={measureScroll}
              onKeyDown={event => {
                if (event.key !== 'Escape' || fromPortal(event)) return;
                event.stopPropagation();
                setSheet('short');
                handle?.focus();
              }}
            >
              <For each={PANELS}>
                {panel => {
                  const body = (
                    <Dynamic
                      component={panel.Body}
                      model={props.model}
                      pageState={props.pageState}
                      stage={props.stage}
                      ThemePicker={props.ThemePicker}
                      size={size}
                      phone={mobile}
                    />
                  );
                  return (
                    <Section
                      id={panel.id}
                      title={t(panel.label)}
                      icon={<panel.Icon size={18} />}
                      summary={panel.summary?.(props.model)}
                      open={openSection() === panel.id}
                      onOpenChange={open => toggleSection(panel.id, open)}
                      height={panel.wide ? fill() : undefined}
                    >
                      <Show when={panel.wide} fallback={body}>
                        <div class={styles.themes}>{body}</div>
                      </Show>
                    </Section>
                  );
                }}
              </For>
            </div>
          </aside>
        </EditingControls>
      </div>
    </div>
  );
}
