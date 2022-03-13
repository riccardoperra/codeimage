import * as styles from './RangeField.css';
import {UseTextProps} from '../Text/useText';
import {Component} from 'solid-js';
import {
  DynamicProps,
  WithRef,
} from 'solid-headless/dist/types/utils/dynamic-prop';
import {omitProps} from 'solid-use';
import {assignInlineVars} from '@vanilla-extract/dynamic';

type RangeFieldProps = {
  value?: number;
  onChange?: (value: number) => void;
  size?: UseTextProps['size'];
} & WithRef<'input'> &
  Omit<DynamicProps<'input'>, 'as' | 'ref' | 'onInput' | 'onChange'>;

export const RangeField: Component<RangeFieldProps> = props => {
  function onChange(e: Event): void {
    if (props.onChange) {
      const target = e.target as HTMLInputElement;
      props.onChange(parseInt(target.value, 10));
    }
  }

  const progress = () => {
    const value = Number(props.value);
    const min = props.min ? Number(props.min) : 0;
    const max = props.max ? Number(props.max) : 100;
    const percent = (value - min) / (max - min);
    return `${percent * 100}%`;
  };

  return (
    <input
      class={styles.range}
      value={props.value}
      onInput={onChange}
      onChange={onChange}
      type={'range'}
      {...omitProps(props, ['class', 'type', 'value', 'onChange'])}
      style={assignInlineVars({
        [styles.rangeVars.rangeProgress]: progress(),
      })}
    />
  );
};
