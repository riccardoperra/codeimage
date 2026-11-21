import {getWhatsNew} from '../../../state/whats-new';
import {getFrameState} from '@codeimage/store/editor/frame';
import {Select} from '@codeui/kit';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {AspectRatioPicker} from '../localized/AspectRatioPicker';
import type {
  ChoiceOption,
  ControlId,
  SegmentedControl,
  SelectControl,
} from '../model';
import * as styles from './controls.css';

export type FieldSize = 'sm' | 'md';
export type ChoiceControl = SegmentedControl | SelectControl;

/** `sidebar-frame-padding` for the frame padding of the Sidebar. */
export const fieldId = (prefix: string, id: ControlId) =>
  `${prefix}-${id.replace('.', '-')}`;

export function SwitchField(props: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** For a switch outside a labelled row. */
  label?: string;
  disabled?: boolean;
}) {
  return (
    <label class={styles.switchRoot}>
      <input
        type="checkbox"
        role="switch"
        id={props.id}
        class={styles.switchInput}
        aria-label={props.label}
        checked={props.checked}
        disabled={props.disabled}
        onChange={event => props.onChange(event.currentTarget.checked)}
      />
      <span
        class={styles.switchControl}
        data-checked={props.checked || undefined}
        data-disabled={props.disabled || undefined}
        aria-hidden="true"
      >
        <span
          class={styles.switchThumb}
          data-checked={props.checked || undefined}
        />
      </span>
    </label>
  );
}

/** Every option in the row, as the kit's segmented control at the kit's height. */
export function SegmentedChoice(props: {
  control: ChoiceControl;
  id: string;
  size?: FieldSize;
}) {
  return (
    <div class={styles.segmented} data-size={props.size ?? 'sm'}>
      <SegmentedField
        adapt
        id={props.id}
        size={props.size ?? 'sm'}
        value={props.control.value()}
        onChange={props.control.set}
        items={props.control
          .options()
          .map(option => ({label: option.label, value: option.key}))}
      />
    </div>
  );
}

/** The kit's select bound to a choice. Its trigger is `<id>-trigger`, its list `<id>-listbox`. */
export function SelectChoice(props: {
  control: ChoiceControl;
  id: string;
  size?: FieldSize;
  /** Space between the trigger and its list. */
  gutter?: number;
  /** Added to the list's popover as it opens, for a layout's own motion rules. */
  listClass?: string;
}) {
  return (
    <Select<ChoiceOption>
      disallowEmptySelection
      options={[...props.control.options()]}
      optionValue="key"
      optionTextValue="label"
      itemLabel={option => option.label}
      valueComponent={option => option().label}
      value={
        props.control
          .options()
          .find(option => option.key === props.control.value()) ?? null
      }
      onChange={option => {
        if (option && option.key !== props.control.value())
          props.control.set(option.key);
      }}
      disabled={props.control.disabled()}
      gutter={props.gutter}
      classes={{content: props.listClass}}
      aria-label={props.control.label()}
      id={props.id}
      size={props.size ?? 'sm'}
    />
  );
}

/**
 * Today's aspect ratio picker, bound to the model's select, where `null` is
 * Auto. Its social sizes write the frame's export target directly.
 */
export function AspectRatioField(props: {control: SelectControl}) {
  const frame = getFrameState();
  return (
    <AspectRatioPicker
      value={props.control.value() === 'null' ? null : props.control.value()}
      onChange={ratio => props.control.set(String(ratio))}
      target={frame.exportTarget()}
      onTargetChange={target => {
        frame.setExportTarget(target);
        if (target) getWhatsNew().seen('social');
      }}
    />
  );
}
