import {themeVars} from '@codeimage/ui';
import {Button, TextField} from '@codeui/kit';
import {Collapsible} from '@kobalte/core/collapsible';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
} from 'solid-js';
import type {JSX, ParentProps} from 'solid-js';
import {FrameToolbar} from '../../../../components/Toolbar/FrameToolbar';
import {Toolbar} from '../../../../components/Toolbar/Toolbar';
import type {VariantMeta, VariantProps} from '../../contract';
import type {Control, ControlId, SectionId, ThemeEntry} from '../../model';
import {ThemeSwatch} from '../../ThemeSwatch';
import {ControlRow} from './controls';
import './inspector.css';

export const meta: VariantMeta = {
  name: 'Inspector',
  axis: 'Everything in one panel',
};

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
type ThemePreview = {
  id: string;
  source: 'pointer' | 'keyboard';
};

function Section(
  props: ParentProps<{
    id: string;
    title: string;
    summary?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }>,
) {
  let trigger: HTMLButtonElement | undefined;
  return (
    <Collapsible
      class="inspector-section"
      data-section={props.id}
      open={props.open}
      onOpenChange={props.onOpenChange}
      onKeyDown={event => {
        if (event.key !== 'Escape' || !props.open) return;
        event.stopPropagation();
        props.onOpenChange(false);
        trigger?.focus();
      }}
    >
      <Collapsible.Trigger
        as={Button}
        class="inspector-section-trigger"
        size="sm"
        theme="secondary"
        variant="ghost"
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
      </Collapsible.Trigger>
      <Collapsible.Content class="inspector-section-content">
        {props.children}
      </Collapsible.Content>
    </Collapsible>
  );
}

function ThemeGrid(props: VariantProps) {
  const [query, setQuery] = createSignal('');
  const [mode, setMode] = createSignal<'all' | 'dark' | 'light'>('all');
  const [preview, setPreview] = createSignal<ThemePreview>();
  let search: HTMLInputElement | undefined;
  const themes = createMemo(() =>
    props.model.themes().filter(theme => {
      const term = query().toLowerCase().replace(/\s/g, '');
      return (
        `${theme.name}${theme.id}`
          .toLowerCase()
          .replace(/\s/g, '')
          .includes(term) &&
        (mode() === 'all' || theme.dark === (mode() === 'dark'))
      );
    }),
  );
  // The editor draws the first theme when the stored id matches none.
  // `active()` stays on the applied theme while another one is previewed.
  const selectedId = () =>
    (
      props.model.themes().find(theme => theme.active()) ??
      props.model.themes()[0]
    )?.id;
  const buttons = new Map<string, HTMLButtonElement>();
  const previewTheme = (theme: ThemeEntry, source: ThemePreview['source']) => {
    setPreview({id: theme.id, source});
    if (theme.id === selectedId()) props.model.endPreview();
    else theme.preview();
  };
  const restore = () => {
    if (!preview()) return;
    setPreview(undefined);
    props.model.endPreview();
  };
  const commit = (theme: ThemeEntry) => {
    setPreview(undefined);
    theme.apply();
  };
  onCleanup(restore);

  // Native handlers run before the prototype picker's document shortcuts.
  const move = (event: KeyboardEvent, current: number) => {
    if (event.key === 'Escape' && preview()) {
      event.preventDefault();
      event.stopPropagation();
      restore();
      search?.focus();
      return;
    }
    const offset = {ArrowRight: 1, ArrowLeft: -1, ArrowDown: 3, ArrowUp: -3}[
      event.key
    ];
    if (offset === undefined && event.key !== 'Home' && event.key !== 'End')
      return;
    event.preventDefault();
    event.stopPropagation();
    const list = themes();
    const index =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? list.length - 1
          : (current + (offset ?? 0) + list.length) % list.length;
    const theme = list[index];
    if (theme) {
      previewTheme(theme, 'keyboard');
      buttons.get(theme.id)?.focus();
    }
  };
  return (
    <div class="inspector-themes">
      <div
        class="inspector-theme-tools"
        onKeyDown={event => {
          if (event.key !== 'ArrowDown') return;
          event.preventDefault();
          event.stopPropagation();
          const first = themes()[0];
          if (first) {
            previewTheme(first, 'keyboard');
            buttons.get(first.id)?.focus();
          }
        }}
      >
        <TextField
          aria-label="Search themes"
          placeholder="Search themes…"
          value={query()}
          onChange={setQuery}
          size="sm"
          ref={element => {
            search = element;
            element.setAttribute('aria-label', 'Search themes');
          }}
        />
        <div class="inspector-theme-filters">
          <SegmentedField<'all' | 'dark' | 'light'>
            value={mode()}
            onChange={value => {
              restore();
              setMode(value);
            }}
            size="sm"
            items={[
              {label: 'All', value: 'all'},
              {label: 'Dark', value: 'dark'},
              {label: 'Light', value: 'light'},
            ]}
          />
          <span class="inspector-count">{themes().length} themes</span>
        </div>
      </div>
      <div
        class="inspector-theme-grid"
        role="group"
        aria-label="Themes"
        onPointerLeave={() => {
          if (preview()?.source === 'pointer') restore();
        }}
        onFocusOut={event => {
          if (
            !event.currentTarget.contains(
              event.relatedTarget instanceof Node ? event.relatedTarget : null,
            ) &&
            preview()?.source === 'keyboard'
          )
            restore();
        }}
      >
        <For each={themes()}>
          {(theme, index) => (
            <button
              class="inspector-theme-tile"
              data-theme-id={theme.id}
              data-previewing={preview()?.id === theme.id ? '' : undefined}
              aria-label={theme.name}
              aria-pressed={selectedId() === theme.id}
              tabIndex={
                (preview()?.id ?? selectedId() ?? themes()[0]?.id) === theme.id
                  ? 0
                  : -1
              }
              ref={element => buttons.set(theme.id, element)}
              onClick={() => commit(theme)}
              onPointerEnter={event => {
                if (event.pointerType === 'mouse')
                  previewTheme(theme, 'pointer');
              }}
              onFocus={() => previewTheme(theme, 'keyboard')}
              on:keydown={event => move(event, index())}
            >
              <span class="inspector-orb">
                <ThemeSwatch theme={theme} size={56} />
              </span>
              <span class="inspector-theme-name">{theme.name}</span>
            </button>
          )}
        </For>
      </div>
      <Show when={!themes().length}>
        <div class="inspector-empty">
          No themes match.
          <Button
            size="sm"
            theme="secondary"
            variant="ghost"
            onClick={() => {
              restore();
              setQuery('');
              setMode('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      </Show>
    </div>
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
  const [openSections, setOpenSections] = createSignal<ReadonlySet<PanelId>>(
    new Set(['themes']),
  );
  const [moreSections, setMoreSections] = createSignal<ReadonlySet<SectionId>>(
    new Set(),
  );
  const [sheet, setSheet] = createSignal<'short' | 'tall'>('short');
  const [mobile, setMobile] = createSignal(
    matchMedia('(max-width: 768px)').matches,
  );
  let panel: HTMLElement | undefined;
  let handle: HTMLButtonElement | undefined;
  let drag:
    | {pointerId: number; startY: number; height: number; time: number}
    | undefined;
  let skipHandleClick = false;
  onMount(() => {
    const media = matchMedia('(max-width: 768px)');
    const update = () => setMobile(media.matches);
    media.addEventListener('change', update);
    // Keep the harness picker from consuming keys after the kit handles a focused control.
    const protectControlKeys = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('.inspector-panel, .inspector-select-portal')
      )
        event.stopImmediatePropagation();
    };
    document.addEventListener('keydown', protectControlKeys);
    onCleanup(() => {
      media.removeEventListener('change', update);
      document.removeEventListener('keydown', protectControlKeys);
    });
  });
  const toggleSection = (id: PanelId, open: boolean) =>
    setOpenSections(current => {
      const next = new Set(current);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  const selectedTheme = () =>
    props.model.themes().find(theme => theme.active());
  createEffect(() => {
    const themes = props.model.themes();
    if (themes.length && !themes.some(theme => theme.active()))
      (themes.find(theme => theme.id === 'fleetDark') ?? themes[0])?.apply();
  });
  // Saved theme ids can hydrate with stale window colors. Reapply through the model without replacing the frame fill.
  createEffect(
    on(
      () => selectedTheme()?.id,
      id => {
        const control = props.model.control('editor.theme');
        if (id && control?.kind === 'select') control.set(id);
      },
    ),
  );
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
    <div class="inspector-root" data-sheet={sheet()} style={tokens}>
      <div class="inspector-header">
        <Show
          when={mobile()}
          fallback={<Toolbar canvasRef={props.stage.exportRef()} />}
        >
          <Toolbar canvasRef={props.stage.exportRef()} />
        </Show>
      </div>
      <div class="inspector-workspace">
        <main
          class="inspector-canvas"
          aria-label="Image preview"
          onPointerDown={() => {
            if (mobile() && sheet() === 'tall') setSheet('short');
          }}
        >
          <div class="inspector-stage">
            <props.stage.Canvas />
          </div>
          <div class="inspector-frame-actions">
            <FrameToolbar frameRef={props.stage.exportRef()} />
            <Show when={mobile()}>
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
              panel.style.height = `${Math.max(92, Math.min(Math.min(560, innerHeight - 284), drag.height + distance))}px`;
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
                    : panel.clientHeight >
                        (92 + Math.min(560, innerHeight - 284)) / 2
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
            onKeyDown={event => {
              if (event.key !== 'Escape') return;
              event.stopPropagation();
              setSheet('short');
              handle?.focus();
            }}
          >
            <Section
              id="themes"
              title="Theme"
              summary={selectedTheme()?.name}
              open={openSections().has('themes')}
              onOpenChange={open => toggleSection('themes', open)}
            >
              <ThemeGrid {...props} />
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
                  open={openSections().has(section.id)}
                  onOpenChange={open => toggleSection(section.id, open)}
                >
                  <For
                    each={section.controls.filter(control =>
                      primaryControls[section.id].includes(control.id),
                    )}
                  >
                    {control => <ControlRow control={control} />}
                  </For>
                  <Collapsible
                    class="inspector-more"
                    open={moreSections().has(section.id)}
                    onOpenChange={open =>
                      setMoreSections(current => {
                        const next = new Set(current);
                        if (open) next.add(section.id);
                        else next.delete(section.id);
                        return next;
                      })
                    }
                    onKeyDown={event => {
                      if (
                        event.key !== 'Escape' ||
                        !moreSections().has(section.id)
                      )
                        return;
                      event.stopPropagation();
                      setMoreSections(
                        current =>
                          new Set([...current].filter(id => id !== section.id)),
                      );
                      event.currentTarget
                        .querySelector<HTMLButtonElement>(
                          '.inspector-more-trigger',
                        )
                        ?.focus();
                    }}
                  >
                    <Collapsible.Trigger
                      as={Button}
                      class="inspector-more-trigger"
                      theme="secondary"
                      size="sm"
                      variant="ghost"
                    >
                      {moreSections().has(section.id) ? 'Less' : 'More'}{' '}
                      {section.id === 'editor' ? 'code' : section.id} options{' '}
                      <span aria-hidden="true">
                        {moreSections().has(section.id) ? '−' : '+'}
                      </span>
                    </Collapsible.Trigger>
                    <Collapsible.Content>
                      <For
                        each={section.controls.filter(
                          control =>
                            !primaryControls[section.id].includes(control.id) &&
                            control.id !== 'editor.theme',
                        )}
                      >
                        {control => <ControlRow control={control} />}
                      </For>
                    </Collapsible.Content>
                  </Collapsible>
                </Section>
              )}
            </For>
          </div>
        </aside>
      </div>
    </div>
  );
}
