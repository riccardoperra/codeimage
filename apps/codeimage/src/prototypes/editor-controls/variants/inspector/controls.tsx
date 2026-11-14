import {RangeField} from '@codeimage/ui';
import {
  Button,
  NumberField,
  Select,
  createSelectOptions,
  themeTokens,
  themeVars as kitVars,
} from '@codeui/kit';
import {Switch} from '@kobalte/core/switch';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {Show, createSignal, onCleanup, onMount} from 'solid-js';
import type {JSX, ParentProps} from 'solid-js';
import {AspectRatioPicker} from '../../../../components/PropertyEditor/controls/AspectRatioPicker/AspectRatioPicker';
import {ColorPickerPopover} from '../../../../components/PropertyEditor/controls/ColorPicker/ColorPicker';
import {
  PanelRow,
  TwoColumnPanelRow,
} from '../../../../components/PropertyEditor/PanelRow';
import {SidebarPopover} from '../../../../components/PropertyEditor/SidebarPopover/SidebarPopover';
import {SidebarPopoverTitle} from '../../../../components/PropertyEditor/SidebarPopover/SidebarPopoverTitle';
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

/**
 * A row whose picker opens over the panel, in the production SidebarPopover
 * the app's own pickers use. The panel places it (see overlays.ts).
 */
function Overlay(
  props: ParentProps<{
    id: string;
    label: string;
    title: string;
    value: string;
    swatch?: string;
  }>,
) {
  const [open, setOpen] = createSignal(false);
  return (
    <PanelRow for={props.id} label={props.label}>
      <TwoColumnPanelRow>
        <SidebarPopover
          open={open()}
          onOpenChange={setOpen}
          input={(trigger: JSX.HTMLAttributes<HTMLButtonElement>) => (
            <Button
              {...trigger}
              id={props.id}
              class="inspector-inline-trigger"
              size="sm"
              theme="secondary"
              variant="ghost"
            >
              <Show when={props.swatch}>
                <span
                  class="inspector-value-swatch"
                  style={{background: props.swatch}}
                />
              </Show>
              <span class="inspector-inline-value">{props.value}</span>
              <span aria-hidden="true">⌄</span>
            </Button>
          )}
        >
          <SidebarPopoverTitle onClose={() => setOpen(false)}>
            {props.title}
          </SidebarPopoverTitle>
          {props.children}
        </SidebarPopover>
      </TwoColumnPanelRow>
    </PanelRow>
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
    <Overlay
      id="inspector-background"
      label="Background"
      title="Background"
      value="Color & image"
      swatch={props.control.value()}
    >
      <ColorPickerContent control={props.control} />
    </Overlay>
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
  // The model keys Auto as 'null'; the production picker takes null.
  return (
    <PanelRow for="inspector-ratio" label={props.control.label()}>
      <TwoColumnPanelRow>
        <AspectRatioPicker
          value={
            props.control.value() === 'null' ? null : props.control.value()
          }
          onChange={ratio => props.control.set(String(ratio))}
        />
      </TwoColumnPanelRow>
    </PanelRow>
  );
}

function renderCustom(control: CustomControl) {
  // The model binds the production TerminalControlField and FontPicker.
  if (control.id === 'window.style')
    return (
      <PanelRow for="inspector-window-style" label="Window style">
        <TwoColumnPanelRow>
          <control.Control />
        </TwoColumnPanelRow>
      </PanelRow>
    );
  if (control.id === 'font.family')
    return (
      <PanelRow for="inspector-font-family" label="Font family">
        <TwoColumnPanelRow>
          <control.Control />
        </TwoColumnPanelRow>
      </PanelRow>
    );
  return (
    <Overlay
      id="inspector-background-image"
      label={control.label()}
      title={control.label()}
      value="Choose image"
    >
      <control.Control />
    </Overlay>
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
