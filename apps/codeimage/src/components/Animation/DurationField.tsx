import {NumberField} from '@codeui/kit';
import {PanelRow, TwoColumnPanelRow} from '../PropertyEditor/PanelRow';

interface DurationFieldProps {
  id: string;
  label: string;
  limits: {readonly min: number; readonly max: number};
  step: number;
  value: number;
  onChange: (ms: number) => void;
}

export function DurationField(props: DurationFieldProps) {
  // A NumberField reports every keystroke, so only values in range are kept
  // while the user types.
  const onChange = (value: number | null | undefined) => {
    const {min, max} = props.limits;
    if (typeof value === 'number' && value >= min && value <= max) {
      props.onChange(value);
    }
  };

  return (
    <PanelRow for={`${props.id}-input`} label={props.label}>
      <TwoColumnPanelRow>
        <NumberField
          id={props.id}
          size={'xs'}
          min={props.limits.min}
          max={props.limits.max}
          step={props.step}
          value={props.value}
          onChange={onChange}
        />
      </TwoColumnPanelRow>
    </PanelRow>
  );
}
