import {RangeField} from '@codeimage/ui';
import {createSelectOptions, NumberField, Select} from '@codeui/kit';
import {Switch as KSwitch} from '@kobalte/core/switch';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import type {JSX} from 'solid-js';
import {Match, Show, Switch} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {AspectRatioPicker} from '../../../../components/PropertyEditor/controls/AspectRatioPicker/AspectRatioPicker';
import {
  FullWidthPanelRow,
  PanelRow,
  TwoColumnPanelRow,
} from '../../../../components/PropertyEditor/PanelRow';
import type {ChoiceControl} from '../../command-menu/listed-model';
import {isChoice} from '../../command-menu/listed-model';
import type {Control, SelectControl, ToggleControl} from '../../model';
import {useDock} from './context';
import {SEGMENTED_CHOICES} from './fields';

const fieldId = (control: Control) => `dock-${control.id}`;

/** The kit has no switch, so this one is Kobalte's, drawn with the app's tokens. */
export function SwitchField(props: {control: ToggleControl}) {
  return (
    <KSwitch
      class="dock-switch"
      checked={props.control.value()}
      onChange={props.control.set}
    >
      <KSwitch.Input
        id={fieldId(props.control)}
        class="dock-switch-input"
        aria-label={props.control.label()}
      />
      <KSwitch.Control class="dock-switch-track">
        <KSwitch.Thumb class="dock-switch-thumb" />
      </KSwitch.Control>
    </KSwitch>
  );
}

export function SegmentedChoice(props: {control: ChoiceControl}) {
  return (
    <SegmentedField
      adapt
      id={fieldId(props.control)}
      size={'sm'}
      value={props.control.value()}
      onChange={props.control.set}
      items={props.control
        .options()
        .map(option => ({label: option.label, value: option.key}))}
    />
  );
}

export function SelectChoice(props: {
  control: ChoiceControl;
  /** Space between the trigger and its list, for a trigger inside the dock bar. */
  gutter?: number;
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
          if (key !== undefined) props.control.set(key);
        },
      )}
      options={options.options()}
      disabled={props.control.disabled()}
      gutter={props.gutter}
      aria-label={props.control.label()}
      id={fieldId(props.control)}
      size={'sm'}
    />
  );
}

/** Today's aspect ratio picker, bound to the model's select. `null` is Auto. */
function AspectRatioField(props: {control: SelectControl}) {
  return (
    <AspectRatioPicker
      value={props.control.value() === 'null' ? null : props.control.value()}
      onChange={ratio => props.control.set(String(ratio))}
    />
  );
}

/**
 * One option as a row of today's sidebar: the same row components and the
 * same kit controls, bound to the harness model.
 */
export function ControlRow(props: {control: Control}): JSX.Element {
  const dock = useDock();
  // The model's own entry: for the window style it is the production picker.
  const picker = () => {
    const original = dock.model.control(props.control.id);
    return original?.kind === 'custom' ? original : undefined;
  };

  return (
    <Show when={props.control.visible()}>
      <PanelRow for={fieldId(props.control)} label={props.control.label()}>
        <Switch>
          <Match when={picker()}>
            {custom => (
              <FullWidthPanelRow>
                <Dynamic component={custom().Control} />
              </FullWidthPanelRow>
            )}
          </Match>
          <Match when={props.control.kind === 'toggle' && props.control}>
            {control => (
              <TwoColumnPanelRow>
                <SwitchField control={control()} />
              </TwoColumnPanelRow>
            )}
          </Match>
          <Match
            when={
              props.control.id === 'frame.aspectRatio' &&
              props.control.kind === 'select' &&
              props.control
            }
          >
            {control => (
              <TwoColumnPanelRow>
                <AspectRatioField control={control()} />
              </TwoColumnPanelRow>
            )}
          </Match>
          <Match when={isChoice(props.control) && props.control}>
            {control => (
              <TwoColumnPanelRow>
                <Show
                  when={SEGMENTED_CHOICES.has(control().id)}
                  fallback={<SelectChoice control={control()} />}
                >
                  <SegmentedChoice control={control()} />
                </Show>
              </TwoColumnPanelRow>
            )}
          </Match>
          <Match when={props.control.kind === 'range' && props.control}>
            {control => (
              <TwoColumnPanelRow>
                <RangeField
                  id={fieldId(control())}
                  value={control().value()}
                  min={control().min}
                  max={control().max}
                  step={control().step}
                  onChange={control().set}
                />
              </TwoColumnPanelRow>
            )}
          </Match>
          <Match when={props.control.kind === 'number' && props.control}>
            {control => (
              <TwoColumnPanelRow>
                <NumberField
                  size={'sm'}
                  id={fieldId(control())}
                  min={control().min}
                  max={control().max}
                  value={control().value()}
                  onChange={value => {
                    if (typeof value === 'number') control().set(value);
                  }}
                />
              </TwoColumnPanelRow>
            )}
          </Match>
        </Switch>
      </PanelRow>
    </Show>
  );
}
