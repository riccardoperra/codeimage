import {RadioGroup} from '@kobalte/core/radio-group';
import {Switch as KSwitch} from '@kobalte/core/switch';
import type {JSX} from 'solid-js';
import {For, Match, Show, Switch} from 'solid-js';
import type {
  Control,
  NumberControl,
  RangeControl,
  ToggleControl,
} from '../../model';
import {useDock} from './context';
import type {ChoiceControl} from './fields';
import {INLINE_CHOICES, isChoice, PLACES} from './fields';
import {ChevronIcon} from './icons';

export function SwitchRow(props: {control: ToggleControl}) {
  return (
    <KSwitch
      class="dock-row dock-switch"
      checked={props.control.value()}
      onChange={props.control.set}
    >
      <KSwitch.Label class="dock-row-label">
        {props.control.label()}
      </KSwitch.Label>
      <KSwitch.Input class="dock-switch-input" />
      <KSwitch.Control class="dock-switch-track">
        <KSwitch.Thumb class="dock-switch-thumb" />
      </KSwitch.Control>
    </KSwitch>
  );
}

export function Segmented(props: {
  control: ChoiceControl;
  class?: string;
  hideLabel?: boolean;
}) {
  return (
    <RadioGroup
      class={`dock-segmented ${props.class ?? ''}`}
      orientation="horizontal"
      value={props.control.value()}
      onChange={props.control.set}
      disabled={props.control.disabled()}
    >
      <RadioGroup.Label
        class={props.hideLabel ? 'dock-sr-only' : 'dock-row-label'}
      >
        {props.control.label()}
      </RadioGroup.Label>
      <div class="dock-segments" role="presentation">
        <For each={props.control.options()}>
          {option => (
            <RadioGroup.Item value={option.key} class="dock-segment">
              <RadioGroup.ItemInput class="dock-segment-input" />
              <RadioGroup.ItemLabel class="dock-segment-label">
                {option.label}
              </RadioGroup.ItemLabel>
            </RadioGroup.Item>
          )}
        </For>
      </div>
    </RadioGroup>
  );
}

/** A choice with too many options for the row. It opens the list in the tray. */
export function ListRow(props: {
  label: string;
  value: string;
  disabled?: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      class="dock-row dock-list-row"
      disabled={props.disabled}
      onClick={() => props.onOpen()}
    >
      <span class="dock-row-label">{props.label}</span>
      <span class="dock-row-value">{props.value}</span>
      <ChevronIcon />
    </button>
  );
}

function ChoiceRow(props: {control: ChoiceControl}) {
  const dock = useDock();
  const value = () =>
    props.control.options().find(o => o.key === props.control.value())?.label ??
    '';
  return (
    <Show
      when={!INLINE_CHOICES.has(props.control.id)}
      fallback={<Segmented control={props.control} class="dock-row" />}
    >
      <ListRow
        label={props.control.label()}
        value={value()}
        disabled={props.control.disabled()}
        onOpen={() =>
          dock.open({
            panel: PLACES[props.control.id].view.panel,
            detail: props.control.id,
          })
        }
      />
    </Show>
  );
}

function RangeRow(props: {control: RangeControl}) {
  const id = () => `dock-${props.control.id}`;
  return (
    <div class="dock-row dock-range">
      <label class="dock-row-label" for={id()}>
        {props.control.label()}
      </label>
      <input
        id={id()}
        type="range"
        min={props.control.min}
        max={props.control.max}
        step={props.control.step}
        value={props.control.value()}
        onInput={e => props.control.set(e.currentTarget.valueAsNumber)}
      />
      <output class="dock-row-value" for={id()}>
        {props.control.value()}
      </output>
    </div>
  );
}

function NumberRow(props: {control: NumberControl}) {
  const id = () => `dock-${props.control.id}`;
  return (
    <div class="dock-row dock-number">
      <label class="dock-row-label" for={id()}>
        {props.control.label()}
      </label>
      <input
        id={id()}
        type="number"
        inputmode="numeric"
        min={props.control.min}
        max={props.control.max}
        value={props.control.value()}
        onChange={e => {
          const next = e.currentTarget.valueAsNumber;
          if (!Number.isNaN(next)) props.control.set(next);
        }}
      />
    </div>
  );
}

/** One row of a group. Kinds that need more room than a row have their own panel. */
export function ControlRow(props: {control: Control}): JSX.Element {
  return (
    <Show when={props.control.visible()}>
      <Switch>
        <Match when={props.control.kind === 'toggle' && props.control}>
          {control => <SwitchRow control={control()} />}
        </Match>
        <Match when={isChoice(props.control) && props.control}>
          {control => <ChoiceRow control={control()} />}
        </Match>
        <Match when={props.control.kind === 'range' && props.control}>
          {control => <RangeRow control={control()} />}
        </Match>
        <Match when={props.control.kind === 'number' && props.control}>
          {control => <NumberRow control={control()} />}
        </Match>
      </Switch>
    </Show>
  );
}
