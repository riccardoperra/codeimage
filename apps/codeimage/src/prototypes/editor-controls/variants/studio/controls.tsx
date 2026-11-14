import {isAssetUrl} from '@codeimage/store/assets/assets';
import {RadioGroup} from '@kobalte/core/radio-group';
import {Select} from '@kobalte/core/select';
import {Switch} from '@kobalte/core/switch';
import clsx from 'clsx';
import type {JSX} from 'solid-js';
import {createSignal, For, Show} from 'solid-js';
import type {
  BackgroundControl,
  ChoiceOption,
  Control,
  ControlId,
  EditorControlsModel,
} from '../../model';
import {CheckIcon, ChevronIcon} from './icons';
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

/** Arrow, Home and End movement through a grid of `count` cells. */
export function moveInGrid(
  e: KeyboardEvent,
  index: number,
  count: number,
  columns: number,
): number | undefined {
  const targets: Record<string, number> = {
    ArrowRight: index + 1,
    ArrowLeft: index - 1,
    ArrowDown: index + columns,
    ArrowUp: index - columns,
    Home: 0,
    End: count - 1,
  };
  const next = targets[e.key];
  if (next === undefined || count === 0) return undefined;
  e.preventDefault();
  e.stopImmediatePropagation();
  return Math.max(0, Math.min(count - 1, next));
}

interface Look {
  readonly label?: string;
  /** A two-value choice drawn as a switch: the key that means on, and off. */
  readonly asSwitch?: {readonly on: string; readonly off: string};
  readonly as?: 'segmented' | 'select';
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
  'frame.padding': {as: 'segmented'},
};

export function SwitchRow(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Switch
      class={styles.switchRoot}
      checked={props.checked}
      onChange={props.onChange}
    >
      <Switch.Input />
      <Switch.Label class={styles.switchLabel}>{props.label}</Switch.Label>
      <Switch.Control class={styles.switchControl}>
        <Switch.Thumb class={styles.switchThumb} />
      </Switch.Control>
    </Switch>
  );
}

export function SegmentedField(props: {
  label: string;
  hideLabel?: boolean;
  options: readonly ChoiceOption[];
  value: string;
  onChange: (key: string) => void;
  class?: string;
}) {
  return (
    <RadioGroup
      class={clsx(styles.stack, props.class)}
      value={props.value}
      onChange={props.onChange}
      orientation="horizontal"
      onKeyDown={ownKeys}
    >
      <RadioGroup.Label
        class={props.hideLabel ? styles.visuallyHidden : styles.label}
      >
        {props.label}
      </RadioGroup.Label>
      <div class={styles.segmented}>
        <For each={props.options}>
          {option => (
            <RadioGroup.Item value={option.key} class={styles.segment}>
              <RadioGroup.ItemInput />
              <RadioGroup.ItemLabel class={styles.segmentLabel}>
                {option.label}
              </RadioGroup.ItemLabel>
            </RadioGroup.Item>
          )}
        </For>
      </div>
    </RadioGroup>
  );
}

export function SelectField(props: {
  label: string;
  options: readonly ChoiceOption[];
  value: string;
  onChange: (key: string) => void;
  disabled?: boolean;
  /** Label above and a full width trigger, for long values like font names. */
  stacked?: boolean;
}) {
  const selected = () =>
    props.options.find(option => option.key === props.value) ?? null;

  return (
    <Select<ChoiceOption>
      class={props.stacked ? styles.stack : styles.row}
      options={[...props.options]}
      optionValue="key"
      optionTextValue="label"
      value={selected()}
      onChange={option => option && props.onChange(option.key)}
      disabled={props.disabled}
      placeholder={props.value || 'None'}
      gutter={4}
      placement="bottom-end"
      itemComponent={item => (
        <Select.Item item={item.item} class={styles.selectItem}>
          <Select.ItemLabel>{item.item.rawValue.label}</Select.ItemLabel>
          <Select.ItemIndicator class={styles.selectItemIndicator}>
            <CheckIcon size={14} />
          </Select.ItemIndicator>
        </Select.Item>
      )}
    >
      <Select.Label class={styles.label}>{props.label}</Select.Label>
      <Select.Trigger
        class={clsx(
          styles.selectTrigger,
          props.stacked && styles.selectTriggerWide,
        )}
        onKeyDown={ownKeys}
      >
        <Select.Value<ChoiceOption> class={styles.selectValue}>
          {state => state.selectedOption()?.label}
        </Select.Value>
        <Select.Icon class={styles.selectIcon}>
          <ChevronIcon size={16} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content class={styles.selectContent} onKeyDown={ownKeys}>
          <Select.Listbox class={styles.selectListbox} />
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}

export function RangeRow(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label class={styles.row}>
      <span class={styles.label}>{props.label}</span>
      <input
        type="range"
        class={styles.range}
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onInput={e => props.onChange(e.currentTarget.valueAsNumber)}
      />
      <span class={styles.rangeValue}>
        {props.value}
        {props.unit}
      </span>
    </label>
  );
}

function NumberRow(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label class={styles.row}>
      <span class={styles.label}>{props.label}</span>
      <input
        type="number"
        inputmode="numeric"
        class={styles.numberInput}
        min={props.min}
        max={props.max}
        value={props.value}
        onChange={e => {
          const next = e.currentTarget.valueAsNumber;
          if (Number.isFinite(next)) {
            props.onChange(Math.max(props.min, Math.min(props.max, next)));
          }
        }}
      />
    </label>
  );
}

type BackgroundMode = 'gradient' | 'color' | 'image';

const backgroundModes: readonly ChoiceOption[] = [
  {key: 'gradient', label: 'Gradient'},
  {key: 'color', label: 'Color'},
  {key: 'image', label: 'Image'},
];

function initialBackgroundMode(control: BackgroundControl): BackgroundMode {
  const value = control.value();
  if (control.colors.includes(value)) return 'color';
  if (isAssetUrl(value)) return 'image';
  return 'gradient';
}

function BackgroundField(props: {
  control: BackgroundControl;
  image: Control | undefined;
}) {
  const [mode, setMode] = createSignal(initialBackgroundMode(props.control));
  const swatches = () =>
    mode() === 'color' ? props.control.colors : props.control.gradients;
  const cells: HTMLButtonElement[] = [];
  const selectedIndex = () => swatches().indexOf(props.control.value());

  const onKeyDown = (e: KeyboardEvent) => {
    const index = cells.indexOf(e.target as HTMLButtonElement);
    if (index < 0) return;
    const next = moveInGrid(e, index, swatches().length, 8);
    if (next === undefined) return;
    props.control.set(swatches()[next]);
    cells[next]?.focus();
  };

  return (
    <div class={styles.stack}>
      <SegmentedField
        label="Background source"
        hideLabel
        options={backgroundModes}
        value={mode()}
        onChange={key => setMode(key as BackgroundMode)}
      />
      <Show
        when={mode() !== 'image'}
        fallback={
          <Show when={props.image}>{image => renderControl(image())}</Show>
        }
      >
        <div
          role="radiogroup"
          aria-label={mode() === 'color' ? 'Colors' : 'Gradients'}
          class={styles.swatchGrid}
          onKeyDown={onKeyDown}
        >
          <For each={swatches()}>
            {(swatch, index) => (
              <button
                ref={el => (cells[index()] = el)}
                type="button"
                role="radio"
                aria-checked={props.control.value() === swatch}
                aria-label={swatch}
                title={swatch}
                tabIndex={index() === Math.max(0, selectedIndex()) ? 0 : -1}
                class={styles.swatch}
                style={{background: swatch}}
                onClick={() => props.control.set(swatch)}
              />
            )}
          </For>
        </div>
        <input
          class={styles.textInput}
          aria-label="Custom background"
          placeholder="#hex, rgb() or a CSS gradient"
          spellcheck={false}
          value={isAssetUrl(props.control.value()) ? '' : props.control.value()}
          onChange={e => {
            const next = e.currentTarget.value.trim();
            if (next) props.control.set(next);
          }}
        />
      </Show>
    </div>
  );
}

/** One row per control kind. The kind of a control never changes, so the branch runs once. */
export function renderControl(
  control: Control,
  model?: EditorControlsModel,
): JSX.Element {
  const look = LOOKS[control.id] ?? {};
  const label = () => look.label ?? control.label();

  switch (control.kind) {
    case 'toggle':
      return (
        <SwitchRow
          label={label()}
          checked={control.value()}
          onChange={control.set}
        />
      );
    case 'segmented':
    case 'select': {
      const asSwitch = look.asSwitch;
      if (asSwitch) {
        return (
          <SwitchRow
            label={label()}
            checked={control.value() === asSwitch.on}
            onChange={on => control.set(on ? asSwitch.on : asSwitch.off)}
          />
        );
      }
      if ((look.as ?? control.kind) === 'segmented') {
        return (
          <SegmentedField
            label={label()}
            options={control.options()}
            value={control.value()}
            onChange={control.set}
          />
        );
      }
      return (
        <SelectField
          label={label()}
          options={control.options()}
          value={control.value()}
          onChange={control.set}
          disabled={control.disabled()}
        />
      );
    }
    case 'range':
      return (
        <RangeRow
          label={label()}
          value={control.value()}
          min={control.min}
          max={control.max}
          step={control.step}
          unit="%"
          onChange={control.set}
        />
      );
    case 'number':
      return (
        <NumberRow
          label={label()}
          value={control.value()}
          min={control.min}
          max={control.max}
          onChange={control.set}
        />
      );
    case 'background':
      return (
        <BackgroundField
          control={control}
          image={model?.control('frame.backgroundImage')}
        />
      );
    case 'custom':
      return <control.Control />;
  }
}

/** Renders the control, or nothing while today's sidebar would hide it. */
export function ControlRow(props: {model: EditorControlsModel; id: ControlId}) {
  const control = props.model.control(props.id);
  return (
    <Show when={control?.visible() && control}>
      {visible => renderControl(visible(), props.model)}
    </Show>
  );
}
