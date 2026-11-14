import {getRootEditorStore} from '@codeimage/store/editor';
import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {RangeField} from '@codeimage/ui';
import {
  Button,
  Listbox,
  NumberField,
  RadioList,
  RadioListItem,
  Select,
  TextField,
  createSelectOptions,
  themeTokens,
  themeVars as kitVars,
} from '@codeui/kit';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {Collapsible} from '@kobalte/core/collapsible';
import {Switch} from '@kobalte/core/switch';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {For, Show, createSignal, onCleanup, onMount} from 'solid-js';
import type {ParentProps} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {provideState} from 'statebuilder';
import {ColorPickerPopover} from '../../../../components/PropertyEditor/controls/ColorPicker/ColorPicker';
import {createFontPickerListboxProps} from '../../../../components/PropertyEditor/controls/FontPicker/FontPickerListbox';
import {FontSystemPicker} from '../../../../components/PropertyEditor/controls/FontPicker/FontSystemPicker';
import {
  PanelRow,
  TwoColumnPanelRow,
} from '../../../../components/PropertyEditor/PanelRow';
import type {
  BackgroundControl,
  Control,
  CustomControl,
  SelectControl,
  SegmentedControl,
} from '../../model';

function Toggle(props: {
  control: Control;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = () => `inspector-${props.control.id.replace('.', '-')}`;
  return (
    <PanelRow for={`${id()}-input`} label={props.label}>
      <TwoColumnPanelRow>
        <Switch
          class="inspector-switch"
          style={{
            '--inspector-switch-on': kitVars.brand,
            '--inspector-switch-off': themeTokens.colors.gray6,
          }}
          id={id()}
          checked={props.checked}
          onChange={props.onChange}
        >
          <span class="inspector-switch-state" aria-hidden="true">
            {props.checked ? 'On' : 'Off'}
          </span>
          <Switch.Input aria-label={props.label} />
          <Switch.Control class="inspector-switch-track">
            <Switch.Thumb class="inspector-switch-thumb" />
          </Switch.Control>
        </Switch>
      </TwoColumnPanelRow>
    </PanelRow>
  );
}

function Inline(
  props: ParentProps<{
    id: string;
    label: string;
    value: string;
    swatch?: string;
  }>,
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
      <PanelRow for={props.id} label={props.label}>
        <TwoColumnPanelRow>
          <Collapsible.Trigger
            as={Button}
            id={props.id}
            class="inspector-inline-trigger"
            size="sm"
            theme="secondary"
            variant="ghost"
            ref={element => {
              trigger = element;
            }}
          >
            <Show when={props.swatch}>
              <span
                class="inspector-value-swatch"
                style={{background: props.swatch}}
              />
            </Show>
            <span class="inspector-inline-value">{props.value}</span>
            <span aria-hidden="true">⌄</span>
          </Collapsible.Trigger>
        </TwoColumnPanelRow>
      </PanelRow>
      <Collapsible.Content class="inspector-inline-content">
        {props.children}
      </Collapsible.Content>
    </Collapsible>
  );
}

function ColorPickerContent(props: {control: BackgroundControl}) {
  let content: HTMLDivElement | undefined;
  onMount(() => {
    const enhancePresets = () => {
      content
        ?.querySelector('input')
        ?.setAttribute('aria-label', 'Color or gradient');
      for (const item of content?.querySelectorAll<HTMLElement>('div[title]') ??
        []) {
        item.setAttribute('role', 'button');
        item.tabIndex = 0;
        item.setAttribute('aria-label', `Background fill ${item.title}`);
        item.setAttribute(
          'aria-pressed',
          String(item.title === props.control.value()),
        );
      }
    };
    // The production color presets are mouse-only. Keep their UI and add keyboard access locally.
    const observer = new MutationObserver(enhancePresets);
    if (content)
      observer.observe(content, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      });
    enhancePresets();
    onCleanup(() => observer.disconnect());
  });
  return (
    <div
      class="inspector-color-picker"
      ref={element => {
        content = element;
      }}
      onKeyDown={event => {
        if (
          (event.key === 'Enter' || event.key === ' ') &&
          event.target instanceof HTMLElement &&
          event.target.matches('div[title][role="button"]')
        ) {
          event.preventDefault();
          event.target.click();
        }
      }}
    >
      <ColorPickerPopover
        value={props.control.value()}
        onChange={props.control.set}
        colors={[...props.control.colors]}
        gradientColors={[...props.control.gradients]}
      />
    </div>
  );
}

function Background(props: {control: BackgroundControl}) {
  return (
    <Inline
      id="inspector-background"
      label="Background"
      value="Color & image"
      swatch={props.control.value()}
    >
      <ColorPickerContent control={props.control} />
    </Inline>
  );
}

function Choice(props: {control: SelectControl | SegmentedControl}) {
  const options = createSelectOptions(() => props.control.options(), {
    key: 'label',
    valueKey: 'key',
  });
  const id = () => `inspector-${props.control.id.replace('.', '-')}`;
  return (
    <PanelRow for={`${id()}-trigger`} label={props.control.label()}>
      <TwoColumnPanelRow>
        <Select
          {...options.props()}
          {...options.controlled(props.control.value, value => {
            if (value !== undefined) props.control.set(value);
          })}
          onChange={option => {
            if (option) props.control.set(option.value);
          }}
          options={options.options()}
          onOpenChange={open => {
            if (!open) return;
            const listboxId = `${id()}-listbox`;
            queueMicrotask(() =>
              document
                .getElementById(listboxId)
                ?.parentElement?.classList.add('inspector-select-portal'),
            );
          }}
          optionValue="value"
          optionTextValue="label"
          multiple={false}
          disallowEmptySelection
          aria-label={props.control.label()}
          disabled={props.control.disabled()}
          id={id()}
          size="sm"
        />
      </TwoColumnPanelRow>
    </PanelRow>
  );
}

function Ratio(props: {control: SelectControl}) {
  return (
    <Inline
      id="inspector-ratio"
      label={props.control.label()}
      value={
        props.control
          .options()
          .find(option => option.key === props.control.value())?.label ?? 'Auto'
      }
    >
      <RadioList
        value={props.control.value()}
        onChange={props.control.set}
        aria-label="Aspect ratio"
        orientation="vertical"
        size="sm"
      >
        <For each={props.control.options()}>
          {option => <RadioListItem value={option.key} label={option.label} />}
        </For>
      </RadioList>
    </Inline>
  );
}

function WindowPicker() {
  const terminal = getTerminalState();
  const editor = getRootEditorStore();
  const labels = {
    macOs: 'macOS',
    macOsGrayTheme: 'Gray',
    macOsOutlineTheme: 'Outline',
    windows: 'Windows',
  };
  const selected = () =>
    AVAILABLE_TERMINAL_THEMES.keys.find(key => key === terminal.state.type) ??
    'macOs';
  return (
    <Inline
      id="inspector-window-style"
      label="Window style"
      value={labels[selected()]}
    >
      <RadioList
        value={terminal.state.type}
        onChange={terminal.setType}
        aria-label="Window style"
        orientation="vertical"
        size="sm"
      >
        <For each={AVAILABLE_TERMINAL_THEMES.keys}>
          {key => (
            <div class="inspector-window-option">
              <RadioListItem value={key} label={labels[key]} />
              <Dynamic
                component={AVAILABLE_TERMINAL_THEMES.entries[key].component}
                lite
                preview
                showTab
                readonlyTab
                showHeader
                showWatermark={false}
                showGlassReflection={false}
                shadow={null}
                background={terminal.state.background}
                textColor={terminal.state.textColor}
                accentVisible={terminal.state.accentVisible}
                alternativeTheme={terminal.state.alternativeTheme}
                opacity={100}
                borderType={null}
                themeId={editor.state.options.themeId}
              />
            </div>
          )}
        </For>
      </RadioList>
    </Inline>
  );
}

function FontPicker() {
  const editor = getRootEditorStore();
  const config = provideState(EditorConfigStore);
  const [query, setQuery] = createSignal('');
  const [source, setSource] = createSignal<'web' | 'system'>('web');
  const list = createFontPickerListboxProps({
    onEsc: () => document.getElementById('inspector-font-family')?.focus(),
    get value() {
      return editor.state.options.fontId;
    },
    onChange: editor.actions.setFontId,
    get items() {
      return config.get.fonts
        .filter(font => font.name.toLowerCase().includes(query().toLowerCase()))
        .map(font => ({label: font.name, value: font.id}));
    },
  });
  return (
    <Inline
      id="inspector-font-family"
      label="Font family"
      value={editor.computed.selectedFont()?.name ?? 'Choose font'}
    >
      <SegmentedField
        value={source()}
        onChange={setSource}
        items={[
          {label: 'Web fonts', value: 'web'},
          {label: 'System fonts', value: 'system'},
        ]}
        size="sm"
        adapt
      />
      <Show
        when={source() === 'web'}
        fallback={
          <FontSystemPicker
            value={editor.state.options.fontId}
            onChange={editor.actions.setFontId}
            onEsc={() =>
              document.getElementById('inspector-font-family')?.focus()
            }
          />
        }
      >
        <TextField
          aria-label="Search fonts"
          placeholder="Search fonts…"
          ref={element => element.setAttribute('aria-label', 'Search fonts')}
          value={query()}
          onChange={setQuery}
          size="sm"
        />
        <div class="inspector-font-list">
          <Listbox {...list} autoFocus={false} aria-label="Font family" />
        </div>
        <Show when={!list.options.length}>
          <p>No fonts match.</p>
        </Show>
      </Show>
    </Inline>
  );
}

function renderCustom(control: CustomControl) {
  if (control.id === 'window.style') return <WindowPicker />;
  if (control.id === 'font.family') return <FontPicker />;
  return (
    <Inline
      id="inspector-background-image"
      label={control.label()}
      value="Choose image"
    >
      <control.Control />
    </Inline>
  );
}

function renderInput(control: Control) {
  const id = `inspector-${control.id.replace('.', '-')}`;
  switch (control.kind) {
    case 'toggle':
      return (
        <Toggle
          control={control}
          label={control.label()}
          checked={control.value()}
          onChange={control.set}
        />
      );
    case 'select':
    case 'segmented': {
      if (control.id === 'window.backgroundType')
        return (
          <Toggle
            control={control}
            label="Alternative background"
            checked={control.value() === 'true'}
            onChange={checked => control.set(String(checked))}
          />
        );
      if (control.id === 'window.border')
        return (
          <Toggle
            control={control}
            label="Glass border"
            checked={control.value() === 'glass'}
            onChange={checked => control.set(checked ? 'glass' : 'none')}
          />
        );
      if (control.id === 'frame.aspectRatio' && control.kind === 'select')
        return <Ratio control={control} />;
      if (control.kind === 'segmented')
        return (
          <PanelRow for={id} label={control.label() || 'Radius'}>
            <TwoColumnPanelRow>
              <SegmentedField
                id={id}
                value={control.value()}
                onChange={control.set}
                items={control
                  .options()
                  .map(option => ({label: option.label, value: option.key}))}
                size="sm"
                adapt
              />
            </TwoColumnPanelRow>
          </PanelRow>
        );
      return <Choice control={control} />;
    }
    case 'background':
      return <Background control={control} />;
    case 'custom':
      return renderCustom(control);
    case 'range':
      return (
        <PanelRow for={id} label={control.label()}>
          <TwoColumnPanelRow>
            <div class="inspector-range">
              <RangeField
                id={id}
                min={control.min}
                max={control.max}
                step={control.step}
                value={control.value()}
                onChange={control.set}
              />
              <output>{control.value()}%</output>
            </div>
          </TwoColumnPanelRow>
        </PanelRow>
      );
    case 'number':
      return (
        <PanelRow for={`${id}-input`} label={control.label()}>
          <TwoColumnPanelRow>
            <NumberField
              id={id}
              aria-label={control.label()}
              size="sm"
              min={control.min}
              max={control.max}
              value={control.value()}
              ref={element =>
                element.setAttribute('aria-label', control.label())
              }
              onChange={value => {
                if (typeof value === 'number') control.set(value);
              }}
            />
          </TwoColumnPanelRow>
        </PanelRow>
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
