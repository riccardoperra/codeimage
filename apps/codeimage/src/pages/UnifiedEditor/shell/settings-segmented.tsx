import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import * as styles from './settings.css';

export function Segmented<T extends string>(props: {
  value: T;
  label?: string;
  disabled?: boolean;
  onChange: (value: T) => void;
  items: readonly {label: string; value: T}[];
}) {
  return (
    <div class={styles.segmented} data-count={props.items.length}>
      <SegmentedField
        adapt
        label={props.label}
        disabled={props.disabled}
        size={'sm'}
        value={props.value}
        onChange={props.onChange}
        items={props.items}
      />
    </div>
  );
}
