import {getRootEditorStore} from '@codeimage/store/editor';
import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {Collapsible} from '@kobalte/core/collapsible';
import {Switch} from '@kobalte/core/switch';
import {For, Show, createMemo, createSignal, onCleanup} from 'solid-js';
import type {ParentProps} from 'solid-js';
import type {Subscription} from 'rxjs';
import {provideState} from 'statebuilder';
import type {BackgroundControl, Control, CustomControl} from '../../model';

function Toggle(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Switch
      class="inspector-row inspector-switch"
      checked={props.checked}
      onChange={props.onChange}
    >
      <Switch.Label class="inspector-label">{props.label}</Switch.Label>
      <span class="inspector-switch-state" aria-hidden="true">
        {props.checked ? 'On' : 'Off'}
      </span>
      <Switch.Input />
      <Switch.Control class="inspector-switch-track">
        <Switch.Thumb class="inspector-switch-thumb" />
      </Switch.Control>
    </Switch>
  );
}

function Inline(
  props: ParentProps<{label: string; value: string; swatch?: string}>,
) {
  const [open, setOpen] = createSignal(false);
  let trigger: HTMLButtonElement | undefined;
  return (
    <Collapsible
      class="inspector-inline"
      open={open()}
      onOpenChange={setOpen}
      onKeyDown={event => {
        if (event.key !== 'Escape' || !open()) return;
        event.stopPropagation();
        setOpen(false);
        trigger?.focus();
      }}
    >
      <Collapsible.Trigger
        as="button"
        class="inspector-row inspector-inline-trigger"
        ref={element => {
          trigger = element;
        }}
      >
        <span class="inspector-label">{props.label}</span>
        <span class="inspector-inline-value" title={props.value}>
          <Show when={props.swatch}>
            <span
              class="inspector-value-swatch"
              style={{background: props.swatch}}
            />
          </Show>
          {props.value}
          <span class="inspector-chevron" aria-hidden="true">
            ›
          </span>
        </span>
      </Collapsible.Trigger>
      <Collapsible.Content class="inspector-inline-content">
        {props.children}
      </Collapsible.Content>
    </Collapsible>
  );
}

function Background(props: {control: BackgroundControl}) {
  return (
    <Inline
      label="Background"
      value="Custom fill"
      swatch={props.control.value()}
    >
      <label class="inspector-field-label" for="inspector-background">
        Color or gradient
      </label>
      <input
        class="inspector-search"
        id="inspector-background"
        type="text"
        value={props.control.value()}
        onChange={event => {
          const input = event.currentTarget;
          if (CSS.supports('background', input.value)) {
            props.control.set(input.value);
            input.setCustomValidity('');
          } else {
            input.setCustomValidity('Enter a CSS color or gradient.');
            input.reportValidity();
          }
        }}
      />
      <div
        class="inspector-swatches"
        role="group"
        aria-label="Background fills"
      >
        <For each={[...props.control.gradients, ...props.control.colors]}>
          {(color, index) => (
            <button
              class="inspector-swatch"
              aria-label={`Background fill ${index() + 1}`}
              title={color}
              aria-pressed={color === props.control.value()}
              style={{background: color}}
              onClick={() => props.control.set(color)}
            >
              {color === props.control.value() ? '✓' : ''}
            </button>
          )}
        </For>
      </div>
    </Inline>
  );
}

const windowLabels = {
  macOs: 'macOS',
  macOsGrayTheme: 'Gray',
  macOsOutlineTheme: 'Outline',
  windows: 'Windows',
};

function WindowPicker() {
  const terminal = getTerminalState();
  const selected = () =>
    AVAILABLE_TERMINAL_THEMES.keys.find(key => key === terminal.state.type) ??
    'macOs';
  return (
    <Inline label="Window style" value={windowLabels[selected()]}>
      <div
        class="inspector-window-options"
        role="group"
        aria-label="Window style"
      >
        <For each={AVAILABLE_TERMINAL_THEMES.keys}>
          {key => (
            <button
              class="inspector-window-option"
              aria-pressed={terminal.state.type === key}
              onClick={() => terminal.setType(key)}
            >
              <span
                class="inspector-window-sketch"
                data-window-style={key}
                aria-hidden="true"
              >
                <i />
                <i />
                <i />
                <span>index.ts</span>
              </span>
              {windowLabels[key]}
            </button>
          )}
        </For>
      </div>
    </Inline>
  );
}

function FontPicker() {
  const editor = getRootEditorStore();
  const config = provideState(EditorConfigStore);
  const [query, setQuery] = createSignal('');
  const [source, setSource] = createSignal<'web' | 'system'>('web');
  const [request, setRequest] = createSignal<
    'idle' | 'loading' | 'error' | 'ready'
  >('idle');
  const fonts = createMemo(() =>
    (source() === 'web' ? config.get.fonts : config.get.systemFonts).filter(
      font => font.name.toLowerCase().includes(query().toLowerCase()),
    ),
  );
  let subscription: Subscription | undefined;
  const loadSystemFonts = () => {
    subscription?.unsubscribe();
    setRequest('loading');
    subscription = config.localFontsApi.accessSystemFonts(false).subscribe({
      next: () => setRequest('ready'),
      error: () => setRequest('error'),
    });
  };
  onCleanup(() => subscription?.unsubscribe());
  return (
    <Inline
      label="Font family"
      value={editor.computed.selectedFont()?.name ?? 'Choose font'}
    >
      <div class="inspector-font-sources" role="group" aria-label="Font source">
        <button
          class="inspector-chip"
          aria-pressed={source() === 'web'}
          onClick={() => setSource('web')}
        >
          Web fonts
        </button>
        <button
          class="inspector-chip"
          aria-pressed={source() === 'system'}
          onClick={() => setSource('system')}
        >
          System fonts
        </button>
      </div>
      <Show when={source() === 'system'}>
        <p class="inspector-help">
          {config.localFontsApi.supported
            ? 'Choose fonts installed on this computer. Your browser asks for permission.'
            : 'This browser does not support access to installed fonts. Web fonts are available.'}
        </p>
        <Show when={config.localFontsApi.supported}>
          <button
            class="inspector-action"
            disabled={request() === 'loading'}
            onClick={loadSystemFonts}
          >
            {request() === 'loading' ? 'Loading fonts…' : 'Load system fonts'}
          </button>
          <Show when={request() === 'error'}>
            <p class="inspector-help" role="status">
              Font access was unavailable. Allow access in your browser
              settings, then try again.
            </p>
          </Show>
        </Show>
      </Show>
      <input
        class="inspector-search"
        aria-label="Search fonts"
        placeholder="Search fonts…"
        value={query()}
        onInput={event => setQuery(event.currentTarget.value)}
      />
      <div class="inspector-font-list" role="group" aria-label="Font family">
        <For each={fonts()}>
          {font => (
            <button
              class="inspector-font-option"
              aria-pressed={editor.state.options.fontId === font.id}
              onClick={() => editor.actions.setFontId(font.id)}
            >
              <span>{font.name}</span>
              <span aria-hidden="true">
                {editor.state.options.fontId === font.id ? '✓' : 'Aa'}
              </span>
            </button>
          )}
        </For>
        <Show
          when={
            !fonts().length && (source() === 'web' || request() === 'ready')
          }
        >
          <p class="inspector-help">No fonts match.</p>
        </Show>
      </div>
    </Inline>
  );
}

function renderCustom(control: CustomControl) {
  if (control.id === 'window.style') return <WindowPicker />;
  if (control.id === 'font.family') return <FontPicker />;
  return (
    <Inline label={control.label()} value="Choose image">
      <control.Control />
    </Inline>
  );
}

function renderInput(control: Control) {
  switch (control.kind) {
    case 'toggle':
      return (
        <Toggle
          label={control.label()}
          checked={control.value()}
          onChange={control.set}
        />
      );
    case 'segmented':
    case 'select': {
      if (control.id === 'window.backgroundType')
        return (
          <Toggle
            label="Alternative background"
            checked={control.value() === 'true'}
            onChange={checked => control.set(String(checked))}
          />
        );
      if (control.id === 'window.border')
        return (
          <Toggle
            label="Glass border"
            checked={control.value() === 'glass'}
            onChange={checked => control.set(checked ? 'glass' : 'none')}
          />
        );
      if (control.id === 'frame.aspectRatio' || control.id === 'frame.radius')
        return (
          <Inline
            label={control.label() || 'Radius'}
            value={
              control.options().find(option => option.key === control.value())
                ?.label ?? 'Auto'
            }
          >
            <div
              class="inspector-choice-grid"
              role="group"
              aria-label={control.label() || 'Radius'}
            >
              <For each={control.options()}>
                {option => (
                  <button
                    class="inspector-chip"
                    aria-pressed={control.value() === option.key}
                    onClick={() => control.set(option.key)}
                  >
                    {option.label}
                  </button>
                )}
              </For>
            </div>
          </Inline>
        );
      return (
        <label class="inspector-row">
          <span class="inspector-label">{control.label()}</span>
          <select
            class="inspector-select"
            value={control.value()}
            disabled={control.disabled()}
            onChange={event => control.set(event.currentTarget.value)}
          >
            <For each={control.options()}>
              {option => <option value={option.key}>{option.label}</option>}
            </For>
          </select>
        </label>
      );
    }
    case 'background':
      return <Background control={control} />;
    case 'custom':
      return renderCustom(control);
    case 'range':
      return (
        <label class="inspector-row">
          <span class="inspector-label">{control.label()}</span>
          <input
            class="inspector-range"
            type="range"
            min={control.min}
            max={control.max}
            step={control.step}
            value={control.value()}
            onInput={event => control.set(event.currentTarget.valueAsNumber)}
          />
          <output class="inspector-range-value">{control.value()}%</output>
        </label>
      );
    case 'number':
      return (
        <label class="inspector-row">
          <span class="inspector-label">{control.label()}</span>
          <input
            class="inspector-number"
            type="number"
            min={control.min}
            max={control.max}
            value={control.value()}
            onChange={event => {
              const value = event.currentTarget.valueAsNumber;
              if (Number.isFinite(value))
                control.set(
                  Math.min(control.max, Math.max(control.min, value)),
                );
            }}
          />
        </label>
      );
    default: {
      const exhaustive: never = control;
      return exhaustive;
    }
  }
}

export function ControlRow(props: {control: Control}) {
  return (
    <Show when={props.control.visible()}>
      <div
        class="inspector-control"
        data-control={props.control.id}
        data-kind={props.control.kind}
      >
        {renderInput(props.control)}
      </div>
    </Show>
  );
}
