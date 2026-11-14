import {themeVars} from '@codeimage/ui';
import {Button} from '@codeui/kit';
import {
  For,
  Show,
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
} from 'solid-js';
import type {JSX, ParentProps} from 'solid-js';
import {commandMenu} from '../../command-menu/state';
import type {VariantMeta, VariantProps} from '../../contract';
import {FrameActions} from '../../controls/FrameActions';
import type {Control, ControlId, SectionId} from '../../model';
import {ControlRow} from './controls';
import {createOverlayPlacement} from './overlays';
import './inspector.css';

export const meta: VariantMeta = {
  name: 'Inspector',
  axis: 'Everything in one panel',
};

// What a section shows first; the rest follow in the model's order.
const primaryControls: Record<SectionId, readonly ControlId[]> = {
  frame: ['frame.padding', 'frame.visible', 'frame.background'],
  window: [
    'window.header',
    'window.style',
    'window.shadow',
    'window.watermark',
  ],
  editor: ['editor.language', 'editor.lineNumbers'],
  font: ['font.family', 'font.weight'],
};
type PanelId = SectionId | 'themes';

function sectionControls(id: SectionId, controls: readonly Control[]) {
  const primary = primaryControls[id];
  return [
    ...primary.flatMap(controlId => controls.filter(c => c.id === controlId)),
    // The syntax theme follows the Theme section.
    ...controls.filter(c => !primary.includes(c.id) && c.id !== 'editor.theme'),
  ];
}

// Solid routes delegated events from a portal to its owner, so the Escape that
// closes an overlay would also reach the section around its trigger.
const fromPortal = (event: KeyboardEvent) =>
  !(event.currentTarget as Node).contains(event.target as Node);

// The arrow keys, Home and End move between the section headers.
function moveBetweenHeaders(event: KeyboardEvent) {
  const headers = [
    ...(event.currentTarget as HTMLElement)
      .closest('.inspector-panel-scroll')!
      .querySelectorAll<HTMLElement>(':scope > .inspector-section > button'),
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
    summary?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** A fixed open height, in place of the content's own. */
    height?: number;
  }>,
) {
  let trigger: HTMLButtonElement | undefined;
  const [measured, setMeasured] = createSignal(0);
  const header = `inspector-section-${props.id}`;
  return (
    <section
      class="inspector-section"
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
        id={header}
        class="inspector-section-trigger"
        aria-expanded={props.open}
        aria-controls={`${header}-body`}
        onClick={() => props.onOpenChange(!props.open)}
        onKeyDown={moveBetweenHeaders}
        ref={element => {
          trigger = element;
        }}
      >
        <span class="inspector-section-name">
          <span class="inspector-chevron" aria-hidden="true">
            ›
          </span>
          {props.title}
        </span>
        <span class="inspector-summary" title={props.summary}>
          {props.summary}
        </span>
      </button>
      <div
        id={`${header}-body`}
        class="inspector-section-body"
        role="region"
        aria-labelledby={header}
        ref={body =>
          createEffect(() => body.toggleAttribute('inert', !props.open))
        }
        style={{
          '--inspector-body-height': `${props.height ?? measured()}px`,
        }}
      >
        <div
          class="inspector-section-content"
          ref={element => {
            const observer = new ResizeObserver(() =>
              setMeasured(element.offsetHeight),
            );
            observer.observe(element);
            onCleanup(() => observer.disconnect());
          }}
        >
          {props.children}
        </div>
      </div>
    </section>
  );
}

function summary(control: Control | undefined): string {
  if (control?.kind === 'select' || control?.kind === 'segmented')
    return (
      control.options().find(option => option.key === control.value())?.label ??
      ''
    );
  return '';
}

export default function Inspector(props: VariantProps) {
  // One section at a time. All may be closed, which leaves the summaries.
  const [openSection, setOpenSection] = createSignal<PanelId | null>('themes');
  const [sheet, setSheet] = createSignal<'short' | 'tall'>('short');
  // How far down the page the layout ends, which sets how tall the sheet
  // may grow. The page's header is above the root.
  const [rootHeight, setRootHeight] = createSignal(innerHeight);
  const tallSheet = () => Math.min(560, rootHeight() - 284);
  const [mobile, setMobile] = createSignal(
    matchMedia('(max-width: 768px)').matches,
  );
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
      ...scroll.querySelectorAll<HTMLElement>(':scope > .inspector-section'),
    ];
    // A section without its body: the header and the island's padding.
    const chrome = sections.reduce((sum, section) => {
      const body = section.querySelector<HTMLElement>(
        ':scope > .inspector-section-body',
      );
      return sum + section.offsetHeight - (body?.offsetHeight ?? 0);
    }, 0);
    const gaps = (parseFloat(box.rowGap) || 0) * (sections.length - 1);
    setFill(Math.max(mobile() ? 436 : 360, Math.floor(inner - chrome - gaps)));
  };
  let handle: HTMLButtonElement | undefined;
  const overlayInset = createOverlayPlacement(
    () => panel,
    () => canvas,
  );
  let drag:
    | {pointerId: number; startY: number; height: number; time: number}
    | undefined;
  let skipHandleClick = false;
  // An open section changes the island padding the theme section leaves room for.
  createEffect(on([openSection, mobile], () => queueMicrotask(measureFill)));
  onMount(() => {
    const media = matchMedia('(max-width: 768px)');
    const update = () => setMobile(media.matches);
    media.addEventListener('change', update);
    onCleanup(() => media.removeEventListener('change', update));
  });
  const toggleSection = (id: PanelId, open: boolean) =>
    setOpenSection(current => (open ? id : current === id ? null : current));
  const selectedTheme = () =>
    props.model.themes().find(theme => theme.active()) ??
    props.model.themes()[0];
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
  const summaries: Record<SectionId, () => string> = {
    frame: () => `${summary(props.model.control('frame.padding'))} px padding`,
    window: () => summary(props.model.control('window.shadow')),
    editor: () => summary(props.model.control('editor.language')),
    font: () => summary(props.model.control('font.weight')),
  };
  const tokens: JSX.CSSProperties = {
    '--inspector-app': themeVars.dynamicColors.panel.background,
    '--inspector-island': themeVars.dynamicColors.background,
    '--inspector-text': themeVars.dynamicColors.baseText,
    '--inspector-muted': themeVars.dynamicColors.descriptionTextColor,
    '--inspector-field': themeVars.dynamicColors.input.backgroundColor,
    '--inspector-accent': themeVars.dynamicColors.primary,
    '--inspector-hover': themeVars.dynamicColors.button.base.hoverColor,
  };
  return (
    <div
      class="inspector-root"
      data-sheet={sheet()}
      style={{...tokens, '--inspector-tall-sheet': `${tallSheet()}px`}}
      ref={root => {
        const observer = new ResizeObserver(() =>
          setRootHeight(root.getBoundingClientRect().bottom),
        );
        observer.observe(root);
        onCleanup(() => observer.disconnect());
      }}
    >
      <div class="inspector-workspace">
        <main
          class="inspector-canvas"
          aria-label="Image preview"
          ref={element => {
            canvas = element;
          }}
          onPointerDown={() => {
            if (mobile() && sheet() === 'tall') setSheet('short');
          }}
        >
          <div
            class="inspector-stage"
            style={{
              'padding-left': `${overlayInset().left}px`,
              'padding-right': `${overlayInset().right}px`,
              'padding-bottom': `${overlayInset().bottom}px`,
            }}
          >
            <props.stage.Canvas />
          </div>
          <div class="inspector-frame-actions">
            <FrameActions frameRef={props.stage.exportRef()} />
            <Show
              when={mobile()}
              fallback={
                <Button
                  class="inspector-command"
                  size="sm"
                  theme="secondary"
                  aria-haspopup="dialog"
                  aria-expanded={commandMenu.isOpen()}
                  onClick={commandMenu.open}
                >
                  Search
                  <kbd>{commandMenu.shortcut}</kbd>
                </Button>
              }
            >
              <props.stage.ExportButton />
            </Show>
          </div>
        </main>
        <aside
          class="inspector-panel"
          aria-label="Image inspector"
          ref={element => {
            panel = element;
          }}
        >
          <Button
            class="inspector-sheet-handle"
            size="sm"
            theme="secondary"
            variant="ghost"
            aria-label={
              sheet() === 'short' ? 'Expand inspector' : 'Collapse inspector'
            }
            aria-expanded={sheet() === 'tall'}
            ref={element => {
              handle = element;
            }}
            onPointerDown={event => {
              if (!event.isPrimary || event.button !== 0 || !panel) return;
              drag = {
                pointerId: event.pointerId,
                startY: event.clientY,
                height: panel.clientHeight,
                time: event.timeStamp,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={event => {
              if (!drag || event.pointerId !== drag.pointerId || !panel) return;
              const distance = drag.startY - event.clientY;
              if (Math.abs(distance) < 8 && !skipHandleClick) return;
              skipHandleClick = true;
              panel.style.height = `${Math.max(92, Math.min(tallSheet(), drag.height + distance))}px`;
              setSheet('tall');
            }}
            onPointerUp={event => {
              if (!drag || event.pointerId !== drag.pointerId || !panel) return;
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
            <span />
          </Button>
          <div class="inspector-quick-controls">
            <Button
              theme="secondary"
              size="sm"
              variant="ghost"
              onClick={() => openQuickControl('themes')}
            >
              Theme
            </Button>
            <Button
              theme="secondary"
              size="sm"
              variant="ghost"
              onClick={() => openQuickControl('frame', 'frame.background')}
            >
              Background
            </Button>
            <Button
              theme="secondary"
              size="sm"
              variant="ghost"
              onClick={() => openQuickControl('frame', 'frame.padding')}
            >
              Padding
            </Button>
            <Button
              theme="secondary"
              size="sm"
              variant="ghost"
              onClick={() => openQuickControl('editor', 'editor.language')}
            >
              Language
            </Button>
          </div>
          <div
            class="inspector-panel-scroll"
            ref={element => {
              scroll = element;
              const observer = new ResizeObserver(measureFill);
              observer.observe(element);
              onCleanup(() => observer.disconnect());
            }}
            onKeyDown={event => {
              if (event.key !== 'Escape' || fromPortal(event)) return;
              event.stopPropagation();
              setSheet('short');
              handle?.focus();
            }}
          >
            <Section
              id="themes"
              title="Theme"
              summary={selectedTheme()?.name}
              open={openSection() === 'themes'}
              onOpenChange={open => toggleSection('themes', open)}
              height={fill()}
            >
              <div class="inspector-themes">
                <props.ThemePicker size={mobile() ? 'md' : 'sm'} />
              </div>
            </Section>
            <For each={props.model.sections}>
              {section => (
                <Section
                  id={section.id}
                  title={
                    section.id === 'editor'
                      ? 'Code'
                      : section.id === 'window'
                        ? 'Window'
                        : section.label()
                  }
                  summary={summaries[section.id]()}
                  open={openSection() === section.id}
                  onOpenChange={open => toggleSection(section.id, open)}
                >
                  <For each={sectionControls(section.id, section.controls)}>
                    {control => <ControlRow control={control} />}
                  </For>
                </Section>
              )}
            </For>
          </div>
        </aside>
      </div>
    </div>
  );
}
