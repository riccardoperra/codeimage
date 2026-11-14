import {RangeField} from '@codeimage/ui';
import {NumberField} from '@codeui/kit';
import type {JSX} from 'solid-js';
import {Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {
  FullWidthPanelRow,
  PanelRow,
  TwoColumnPanelRow,
} from '../../../components/PropertyEditor/PanelRow';
import type {Control, ControlId} from '../model';
import * as styles from './controls.css';
import type {FieldSize} from './fields';
import {
  AspectRatioField,
  fieldId,
  SegmentedChoice,
  SelectChoice,
  SwitchField,
} from './fields';
import {WindowStyleTiles} from './WindowStyleTiles';

interface Look {
  readonly label?: string;
  /** A two-value choice drawn as a switch: the key that means on, and off. */
  readonly asSwitch?: {readonly on: string; readonly off: string};
}

// Two-value choices that are an on/off question become switches whose label
// says what turns on, so they read the same in every layout.
const LOOKS: Partial<Record<ControlId, Look>> = {
  'window.backgroundType': {
    label: 'Alternative background',
    asSwitch: {on: 'true', off: 'false'},
  },
  'window.border': {
    label: 'Glass border',
    asSwitch: {on: 'glass', off: 'none'},
  },
  'window.style': {label: 'Window style'},
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
  // The kind of a control never changes, so the branch runs once.
  const control = props.control;
  const look = LOOKS[control.id] ?? {};
  const id = fieldId(props.prefix, control.id);
  const size = () => props.size ?? 'sm';

  const field = (): {
    element: JSX.Element;
    labelFor: string;
    full?: boolean;
  } => {
    if (control.id === 'window.style')
      return {element: <WindowStyleTiles />, labelFor: id, full: true};
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
        if (control.id === 'frame.aspectRatio' && control.kind === 'select')
          return {
            element: <AspectRatioField control={control} />,
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
              ref={(element?: HTMLElement) =>
                element?.setAttribute('aria-label', control.label())
              }
              onChange={value => {
                if (typeof value === 'number') control.set(value);
              }}
            />
          ),
          labelFor: `${id}-input`,
        };
      case 'custom':
        // The production pickers the model binds: the font picker fits the
        // value column, the image upload takes the whole row.
        return {
          element: <Dynamic component={control.Control} />,
          labelFor: id,
          full: control.id !== 'font.family',
        };
      case 'background':
        return {element: null, labelFor: id};
    }
  };

  const {element, labelFor, full} = field();
  return (
    <Show when={element && control.visible()}>
      <div
        class={styles.row}
        data-control={control.id}
        data-kind={control.kind}
      >
        <PanelRow for={labelFor} label={look.label ?? control.label()}>
          <Show
            when={full}
            fallback={<TwoColumnPanelRow>{element}</TwoColumnPanelRow>}
          >
            <FullWidthPanelRow>{element}</FullWidthPanelRow>
          </Show>
        </PanelRow>
      </div>
    </Show>
  );
}
