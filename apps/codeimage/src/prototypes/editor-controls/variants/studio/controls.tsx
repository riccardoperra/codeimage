import {RangeField} from '@codeimage/ui';
import {createSelectOptions, NumberField, Select} from '@codeui/kit';
import {Switch} from '@kobalte/core/switch';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import type {JSX} from 'solid-js';
import {Show} from 'solid-js';
import {
  PanelRow,
  TwoColumnPanelRow,
} from '../../../../components/PropertyEditor/PanelRow';
import type {Control, ControlId, EditorControlsModel} from '../../model';
import * as styles from './studio.css';

/**
 * The picker switches variants on ArrowLeft, ArrowRight, digits and R from a
 * `document` listener. Solid delegates these handlers to `document` too, and
 * registers first, so only stopImmediatePropagation keeps the keys here.
 */
export function ownKeys(e: KeyboardEvent) {
  if (/^(ArrowLeft|ArrowRight|[0-9rR])$/.test(e.key)) {
    e.stopImmediatePropagation();
  }
}

const COMPOSITE =
  '[role=radiogroup], [role=tablist], [role=listbox], [aria-haspopup=listbox]';

/** Keeps arrow keys and typeahead inside segmented controls, selects and grids. */
export function ownCompositeKeys(e: KeyboardEvent) {
  if ((e.target as Element).closest?.(COMPOSITE)) ownKeys(e);
}

interface Look {
  readonly label?: string;
  /** A two-value choice drawn as a switch: the key that means on, and off. */
  readonly asSwitch?: {readonly on: string; readonly off: string};
}

// Booleans become switches whose label carries the meaning, so on and off
// read the same everywhere.
const LOOKS: Partial<Record<ControlId, Look>> = {
  'window.backgroundType': {
    label: 'Alternative background',
    asSwitch: {on: 'true', off: 'false'},
  },
  'window.border': {
    label: 'Glass border',
    asSwitch: {on: 'glass', off: 'none'},
  },
};

export function SwitchField(props: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Switch
      class={styles.switchRoot}
      checked={props.checked}
      onChange={props.onChange}
    >
      <Switch.Input id={props.id} />
      <Switch.Control class={styles.switchControl}>
        <Switch.Thumb class={styles.switchThumb} />
      </Switch.Control>
    </Switch>
  );
}

function fieldId(id: ControlId) {
  return `studio-${id.replace('.', '-')}`;
}

function ChoiceSelect(props: {
  id: string;
  label: string;
  options: readonly {key: string; label: string}[];
  value: string;
  onChange: (key: string) => void;
  disabled?: boolean;
  size: 'sm' | 'md';
}) {
  const options = createSelectOptions(
    () =>
      props.options.map(option => ({label: option.label, value: option.key})),
    {key: 'label', valueKey: 'value'},
  );
  return (
    // @ts-expect-error Fix @codeui/kit types, as the production forms do
    <Select
      {...options.props()}
      {...options.controlled(
        () => props.value,
        key => {
          if (typeof key === 'string') props.onChange(key);
        },
      )}
      options={options.options()}
      aria-label={props.label}
      id={props.id}
      size={props.size}
      disabled={props.disabled}
    />
  );
}

/**
 * One row per control kind, laid out with the production sidebar rows. The
 * kind of a control never changes, so the branch runs once.
 */
export function renderControl(
  control: Control,
  size: () => 'sm' | 'md',
): JSX.Element {
  const look = LOOKS[control.id] ?? {};
  const label = () => look.label ?? control.label();
  const id = fieldId(control.id);

  const field = (): JSX.Element => {
    switch (control.kind) {
      case 'toggle':
        return (
          <SwitchField
            id={id}
            checked={control.value()}
            onChange={control.set}
          />
        );
      case 'segmented':
      case 'select': {
        const asSwitch = look.asSwitch;
        if (asSwitch) {
          return (
            <SwitchField
              id={id}
              checked={control.value() === asSwitch.on}
              onChange={on => control.set(on ? asSwitch.on : asSwitch.off)}
            />
          );
        }
        if (control.kind === 'segmented') {
          return (
            <SegmentedField
              adapt
              id={id}
              size={size()}
              value={control.value()}
              onChange={control.set}
              items={control.options().map(option => ({
                label: option.label,
                value: option.key,
              }))}
            />
          );
        }
        return (
          <ChoiceSelect
            id={id}
            label={label()}
            options={control.options()}
            value={control.value()}
            onChange={control.set}
            disabled={control.disabled()}
            size={size()}
          />
        );
      }
      case 'range':
        return (
          <RangeField
            id={id}
            value={control.value()}
            min={control.min}
            max={control.max}
            step={control.step}
            onChange={control.set}
          />
        );
      case 'number':
        return (
          <NumberField
            id={id}
            size={size()}
            min={control.min}
            max={control.max}
            value={control.value()}
            onChange={value => {
              if (typeof value === 'number') control.set(value);
            }}
          />
        );
      case 'background':
      case 'custom':
        return null;
    }
  };

  // The kit's select puts the id on its root and names the trigger `<id>-trigger`.
  const labelFor =
    control.kind === 'select' && !look.asSwitch ? `${id}-trigger` : id;
  return (
    <PanelRow for={labelFor} label={label()}>
      <TwoColumnPanelRow>{field()}</TwoColumnPanelRow>
    </PanelRow>
  );
}

/** Renders the control, or nothing while today's sidebar would hide it. */
export function ControlRow(props: {
  model: EditorControlsModel;
  id: ControlId;
  size: () => 'sm' | 'md';
}) {
  const control = props.model.control(props.id);
  return (
    <Show when={control?.visible() && control}>
      {visible => renderControl(visible(), props.size)}
    </Show>
  );
}
