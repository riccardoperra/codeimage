import {getUiStore} from '@codeimage/store/ui';
import {themeVars} from '@codeimage/ui';
import {Collapsible} from '@kobalte/core/collapsible';
import {For, Show, createEffect, createMemo, createSignal} from 'solid-js';
import type {JSX, ParentProps} from 'solid-js';
import type {VariantMeta, VariantProps} from '../../contract';
import type {Control, ControlId, SectionId} from '../../model';
import {ControlRow} from './controls';
import './inspector.css';

export const meta: VariantMeta = {
  name: 'Inspector',
  axis: 'Density with compact collapsible sections',
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
        as="button"
        class="inspector-section-trigger"
        ref={element => {
          trigger = element;
        }}
      >
        <span class="inspector-chevron" aria-hidden="true">
          ›
        </span>
        <span>{props.title}</span>
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
  const themes = createMemo(() =>
    props.model.themes().filter(theme => {
      const term = query().toLowerCase().replace(/\s/g, '');
      const matches = `${theme.name}${theme.id}`
        .toLowerCase()
        .replace(/\s/g, '')
        .includes(term);
      return (
        matches && (mode() === 'all' || theme.dark === (mode() === 'dark'))
      );
    }),
  );
  const buttons = new Map<string, HTMLButtonElement>();
  // Native key handlers run before the prototype picker's document shortcuts.
  const move = (event: KeyboardEvent, current: number) => {
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
    if (!theme) return;
    theme.apply();
    buttons.get(theme.id)?.focus();
  };
  const selectedId = () =>
    themes().find(theme => theme.active())?.id ?? themes()[0]?.id;
  return (
    <div class="inspector-themes">
      <input
        class="inspector-search"
        type="search"
        aria-label="Search themes"
        placeholder="Search themes…"
        value={query()}
        onInput={event => setQuery(event.currentTarget.value)}
        on:keydown={event => {
          if (event.key !== 'ArrowDown') return;
          event.preventDefault();
          event.stopPropagation();
          const first = themes()[0];
          if (first) {
            first.apply();
            buttons.get(first.id)?.focus();
          }
        }}
      />
      <div class="inspector-theme-filters" aria-label="Theme appearance">
        <For
          each={['all', 'dark', 'light'] satisfies ('all' | 'dark' | 'light')[]}
        >
          {value => (
            <button
              class="inspector-chip"
              aria-pressed={mode() === value}
              onClick={() => setMode(value)}
            >
              {value === 'all' ? 'All' : value === 'dark' ? 'Dark' : 'Light'}
            </button>
          )}
        </For>
        <span class="inspector-count">{themes().length} themes</span>
      </div>
      <div class="inspector-theme-grid" role="group" aria-label="Themes">
        <For each={themes()}>
          {(theme, index) => (
            <button
              class="inspector-theme-tile"
              data-theme-id={theme.id}
              title={theme.name}
              aria-label={theme.name}
              aria-pressed={theme.active()}
              tabIndex={selectedId() === theme.id ? 0 : -1}
              ref={element => buttons.set(theme.id, element)}
              onClick={() => theme.apply()}
              on:keydown={event => move(event, index())}
            >
              <span
                class="inspector-theme-sample"
                style={{background: theme.colors.background}}
                aria-hidden="true"
              >
                <span
                  class="inspector-theme-code"
                  style={{
                    background: theme.colors.window,
                    color: theme.colors.text,
                  }}
                >
                  <span>
                    {'{ '}
                    <b>code</b>
                    {' }'}
                  </span>
                </span>
                <Show when={theme.active()}>
                  <span class="inspector-theme-check">✓</span>
                </Show>
              </span>
              <span class="inspector-theme-name">{theme.name}</span>
            </button>
          )}
        </For>
      </div>
      <Show when={!themes().length}>
        <div class="inspector-empty">
          No themes match.
          <button
            class="inspector-text-button"
            onClick={() => {
              setQuery('');
              setMode('all');
            }}
          >
            Clear filters
          </button>
        </div>
      </Show>
      <p class="inspector-theme-hint">Arrow keys preview themes instantly</p>
    </div>
  );
}

function summary(control: Control | undefined): string {
  if (!control) return '';
  if (control.kind === 'select' || control.kind === 'segmented')
    return (
      control.options().find(option => option.key === control.value())?.label ??
      ''
    );
  return '';
}

export default function Inspector(props: VariantProps) {
  const ui = getUiStore();
  const [openSections, setOpenSections] = createSignal<ReadonlySet<PanelId>>(
    new Set(['themes', 'frame']),
  );
  const [sheet, setSheet] = createSignal<'short' | 'tall'>('short');
  const [moreSections, setMoreSections] = createSignal<ReadonlySet<SectionId>>(
    new Set(),
  );
  let panel: HTMLElement | undefined;
  let handle: HTMLButtonElement | undefined;
  let drag:
    | {pointerId: number; startY: number; height: number; time: number}
    | undefined;
  let skipHandleClick = false;
  const toggleSection = (id: PanelId, open: boolean) =>
    setOpenSections(current => {
      const next = new Set(current);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  const selectedTheme = () =>
    props.model.themes().find(theme => theme.active());

  // The production default uses an old theme id. Normalize only this prototype.
  createEffect(() => {
    const themes = props.model.themes();
    if (themes.length && !themes.some(theme => theme.active()))
      (themes.find(theme => theme.id === 'fleetDark') ?? themes[0])?.apply();
  });

  const openQuickControl = (id: PanelId, controlId?: ControlId) => {
    setSheet('tall');
    toggleSection(id, true);
    queueMicrotask(() => {
      const target = controlId
        ? panel?.querySelector<HTMLElement>(`[data-control="${controlId}"]`)
        : panel?.querySelector<HTMLElement>(`[data-section="${id}"]`);
      target?.scrollIntoView({block: 'start'});
      target
        ?.querySelector<HTMLElement>('input, button, select')
        ?.focus({preventScroll: true});
    });
  };
  const summaries: Record<SectionId, () => string> = {
    frame: () => `${summary(props.model.control('frame.padding'))} padding`,
    window: () => summary(props.model.control('window.shadow')),
    editor: () => summary(props.model.control('editor.language')),
    font: () => summary(props.model.control('font.weight')),
  };
  const tokens: JSX.CSSProperties = {
    '--inspector-panel': themeVars.dynamicColors.panel.background,
    '--inspector-canvas': themeVars.dynamicColors.background,
    '--inspector-text': themeVars.dynamicColors.baseText,
    '--inspector-muted': themeVars.dynamicColors.descriptionTextColor,
    '--inspector-line': themeVars.dynamicColors.divider,
    '--inspector-field': themeVars.dynamicColors.input.backgroundColor,
    '--inspector-accent': themeVars.dynamicColors.primary,
    '--inspector-hover': themeVars.dynamicColors.button.base.hoverColor,
  };

  return (
    <div class="inspector-root" data-sheet={sheet()} style={tokens}>
      <header class="inspector-header">
        <div class="inspector-brand">
          <span class="inspector-mark" aria-hidden="true">
            {'</>'}
          </span>
          <strong>CodeImage</strong>
          <span class="inspector-workspace">Untitled image</span>
        </div>
        <div class="inspector-header-actions">
          <button
            class="inspector-action inspector-appearance"
            aria-label={`Switch to ${ui.invertedThemeMode()} appearance`}
            onClick={() => ui.toggleThemeMode()}
          >
            ◐
          </button>
          <props.stage.CopyToClipboardButton />
          <props.stage.ExportButton />
        </div>
      </header>
      <main
        class="inspector-canvas"
        aria-label="Image preview"
        onPointerDown={() => {
          if (sheet() === 'tall') setSheet('short');
        }}
      >
        <div class="inspector-canvas-caption">
          <span>PREVIEW</span>
          <span>Changes save automatically</span>
        </div>
        <div class="inspector-stage">
          <props.stage.Canvas />
        </div>
        <div class="inspector-canvas-toolbar">
          <button
            class="inspector-action"
            onClick={() => props.stage.randomize()}
          >
            Shuffle theme
          </button>
          <button
            class="inspector-action"
            disabled={!props.stage.canFormat()}
            onClick={() => props.stage.format()}
          >
            Format code
          </button>
        </div>
      </main>
      <aside
        class="inspector-panel"
        aria-label="Image inspector"
        ref={element => {
          panel = element;
        }}
      >
        <button
          class="inspector-sheet-handle"
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
            panel.style.height = `${Math.max(92, Math.min(Math.min(588, innerHeight - 256), drag.height + distance))}px`;
            setSheet('tall');
          }}
          onPointerUp={event => {
            if (!drag || event.pointerId !== drag.pointerId || !panel) return;
            if (skipHandleClick) {
              const distance = drag.startY - event.clientY;
              const velocity =
                distance / Math.max(1, event.timeStamp - drag.time);
              setSheet(
                Math.abs(velocity) > 0.11
                  ? velocity > 0
                    ? 'tall'
                    : 'short'
                  : panel.clientHeight >
                      (92 + Math.min(588, innerHeight - 256)) / 2
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
        </button>
        <div class="inspector-panel-heading">
          <h1>Inspector</h1>
          <span>Image settings</span>
        </div>
        <div class="inspector-quick-controls">
          <button
            class="inspector-chip"
            onClick={() => openQuickControl('themes')}
          >
            Theme
          </button>
          <button
            class="inspector-chip"
            onClick={() => openQuickControl('frame', 'frame.background')}
          >
            Background
          </button>
          <button
            class="inspector-chip"
            onClick={() => openQuickControl('frame', 'frame.padding')}
          >
            Padding
          </button>
          <button
            class="inspector-chip"
            onClick={() => openQuickControl('editor', 'editor.language')}
          >
            Language
          </button>
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
            {section => {
              const primary = () =>
                section.controls.filter(control =>
                  primaryControls[section.id].includes(control.id),
                );
              const more = () =>
                section.controls.filter(
                  control =>
                    !primaryControls[section.id].includes(control.id) &&
                    control.id !== 'editor.theme',
                );
              return (
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
                  <For each={primary()}>
                    {control => <ControlRow control={control} />}
                  </For>
                  <Collapsible
                    class="inspector-more"
                    open={moreSections().has(section.id)}
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
                    onOpenChange={open =>
                      setMoreSections(current => {
                        const next = new Set(current);
                        if (open) next.add(section.id);
                        else next.delete(section.id);
                        return next;
                      })
                    }
                  >
                    <Collapsible.Trigger class="inspector-more-trigger">
                      {moreSections().has(section.id) ? 'Less' : 'More'}{' '}
                      {section.id === 'editor' ? 'code' : section.id} options{' '}
                      <span aria-hidden="true">
                        {moreSections().has(section.id) ? '−' : '+'}
                      </span>
                    </Collapsible.Trigger>
                    <Collapsible.Content>
                      <For each={more()}>
                        {control => <ControlRow control={control} />}
                      </For>
                    </Collapsible.Content>
                  </Collapsible>
                </Section>
              );
            }}
          </For>
        </div>
      </aside>
    </div>
  );
}
