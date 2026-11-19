import {useI18n} from '@codeimage/locale';
import type {LocaleKeys} from '@codeimage/locale';
import {RangeField} from '@codeimage/ui';
import {NumberField} from '@ui/legacy-controls';
import {Show, createEffect, createSignal} from 'solid-js';
import type {JSX} from '@solidjs/web';
import {Dynamic} from '@solidjs/web';
import {NewDot} from '../../../components/WhatsNew/NewDot';
import {
  PanelRow,
  TwoColumnPanelRow,
} from '../../../components/PropertyEditor/PanelRow';
import type {AppLocaleEntries} from '../../../i18n';
import type {Control, ControlId} from '../model';
import {PickerField} from './ControlOverlay';
import * as styles from './controls.css';
import {fieldId, SegmentedChoice, SelectChoice, SwitchField} from './fields';
import type {FieldSize} from './fields';
import {
  SignatureIconChoice,
  SignaturePositionChoice,
  SignatureStyleChoice,
} from './SignatureFields';
import {SurfaceTiles} from './WindowStyleTiles';

interface Look {
  readonly label?: LocaleKeys<AppLocaleEntries>;
  /** A two-value choice drawn as a switch: the key that means on, and off. */
  readonly asSwitch?: {readonly on: string; readonly off: string};
}

// Two-value choices that are an on/off question become switches whose label
// says what turns on, so they read the same in every layout.
const LOOKS: Partial<Record<ControlId, Look>> = {
  'window.backgroundType': {
    label: 'editor.alternativeBackground',
    asSwitch: {on: 'true', off: 'false'},
  },
  'window.style': {label: 'editor.windowStyle'},
};

export interface ControlRowProps {
  readonly control: Control;
  /** Starts every field id, so that each layout keeps its own: `inspector`, `dock`, `studio`. */
  readonly prefix: string;
  readonly size?: FieldSize;
  /** Added to a select's list as it opens. */
  readonly listClass?: string;
}

/**
 * One option as a row of today's sidebar, with the production row
 * components and the shared fields. The background is left to each layout,
 * which places the colour picker its own way.
 */
export function ControlRow(props: ControlRowProps): JSX.Element {
  const [t] = useI18n<AppLocaleEntries>();
  // The kind of a control never changes, so the branch runs once.
  const control = props.control;
  const look = LOOKS[control.id] ?? {};
  const id = fieldId(props.prefix, control.id);
  const size = () => props.size ?? 'sm';
  const [numberInput, setNumberInput] = createSignal<HTMLElement>();
  createEffect(
    () =>
      [numberInput(), control.kind === 'number' && control.label()] as const,
    ([input, label]) => {
      if (label) input?.setAttribute('aria-label', label);
    },
  );

  const field = (): {
    element: JSX.Element;
    labelFor: string;
  } => {
    if (
      control.id === 'frame.aspectRatio' ||
      control.id === 'window.style' ||
      control.id === 'frame.backgroundImage' ||
      control.kind === 'background'
    )
      return {
        element: <PickerField control={control} id={id} />,
        labelFor: id,
      };
    if (control.kind === 'segmented') {
      if (control.id === 'window.surface')
        return {
          element: <SurfaceTiles control={control} id={id} />,
          labelFor: id,
        };
      if (control.id === 'signature.style')
        return {
          element: (
            <SignatureStyleChoice control={control} id={id} size={size()} />
          ),
          labelFor: id,
        };
      if (control.id === 'signature.platform')
        return {
          element: (
            <SignatureIconChoice control={control} id={id} size={size()} />
          ),
          labelFor: id,
        };
      if (control.id === 'signature.position')
        return {
          element: (
            <SignaturePositionChoice control={control} id={id} size={size()} />
          ),
          labelFor: id,
        };
    }
    switch (control.kind) {
      case 'toggle':
        return {
          element: (
            <SwitchField
              id={id}
              checked={control.value()}
              onChange={control.set}
            />
          ),
          labelFor: id,
        };
      case 'segmented':
      case 'select': {
        const asSwitch = look.asSwitch;
        if (asSwitch)
          return {
            element: (
              <SwitchField
                id={id}
                checked={control.value() === asSwitch.on}
                onChange={on => control.set(on ? asSwitch.on : asSwitch.off)}
              />
            ),
            labelFor: id,
          };
        if (control.kind === 'segmented')
          return {
            element: (
              <SegmentedChoice control={control} id={id} size={size()} />
            ),
            labelFor: id,
          };
        return {
          element: (
            <SelectChoice
              control={control}
              id={id}
              size={size()}
              listClass={props.listClass}
            />
          ),
          // The kit's select puts the id on its root and names the trigger `<id>-trigger`.
          labelFor: `${id}-trigger`,
        };
      }
      case 'range':
        return {
          element: (
            <RangeField
              id={id}
              value={control.value()}
              min={control.min}
              max={control.max}
              step={control.step}
              onChange={control.set}
            />
          ),
          labelFor: id,
        };
      case 'number':
        return {
          element: (
            <NumberField
              id={id}
              aria-label={control.label()}
              size={size()}
              min={control.min}
              max={control.max}
              value={control.value()}
              ref={setNumberInput}
              onChange={value => {
                if (typeof value === 'number') control.set(value);
              }}
            />
          ),
          labelFor: `${id}-input`,
        };
      case 'custom':
        // The font picker and signature fields fit the value column.
        // The text fields name their
        // input `<id>-input`.
        return {
          element: <Dynamic component={control.Control} id={id} />,
          labelFor:
            control.id === 'signature.handle' ||
            control.id === 'signature.name' ||
            control.id === 'signature.profile'
              ? `${id}-input`
              : id,
        };
    }
  };

  const {element, labelFor} = field();
  return (
    <Show when={element && control.visible()}>
      <div
        class={styles.row}
        data-control={control.id}
        data-kind={control.kind}
      >
        <PanelRow
          for={labelFor}
          label={look.label ? t(look.label) : control.label()}
          labelAccessory={<NewDot at={`control:${control.id}`} />}
        >
          <TwoColumnPanelRow>{element}</TwoColumnPanelRow>
        </PanelRow>
      </div>
    </Show>
  );
}
