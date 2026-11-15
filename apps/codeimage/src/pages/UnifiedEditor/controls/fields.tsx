import {getFrameState} from '@codeimage/store/editor/frame';
import {createSelectOptions, Select} from '@codeui/kit';
import {Switch} from '@kobalte/core/switch';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {AspectRatioPicker} from '../localized/AspectRatioPicker';
import type {ControlId, SegmentedControl, SelectControl} from '../model';
import * as styles from './controls.css';

export type FieldSize = 'sm' | 'md';
export type ChoiceControl = SegmentedControl | SelectControl;

/** `inspector-frame-padding` for the frame padding of Inspector. */
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
    <Switch
      class={styles.switchRoot}
      checked={props.checked}
      onChange={props.onChange}
      disabled={props.disabled}
    >
      <Switch.Input id={props.id} aria-label={props.label} />
      <Switch.Control class={styles.switchControl}>
        <Switch.Thumb class={styles.switchThumb} />
      </Switch.Control>
    </Switch>
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
  const options = createSelectOptions(
    () =>
      props.control
        .options()
        .map(option => ({label: option.label, value: option.key})),
    {key: 'label', valueKey: 'value'},
  );
  return (
    // @ts-expect-error The kit's Select types reject the props its own helper returns.
    <Select
      disallowEmptySelection
      {...options.props()}
      {...options.controlled(
        () => props.control.value(),
        key => {
          // Kobalte also reports the selection it already holds whenever
          // its options are rebuilt, as the formatters are when a preview
          // restores the active tab. Saving that would end the preview.
          if (key !== undefined && key !== props.control.value())
            props.control.set(key);
        },
      )}
      options={options.options()}
      disabled={props.control.disabled()}
      gutter={props.gutter}
      onOpenChange={(open: boolean) => {
        const listClass = props.listClass;
        if (!open || !listClass) return;
        queueMicrotask(() =>
          document
            .getElementById(`${props.id}-listbox`)
            ?.parentElement?.classList.add(listClass),
        );
      }}
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
      onTargetChange={frame.setExportTarget}
    />
  );
}
