import {
  DynamicProps,
  WithRef,
} from 'solid-headless/dist/types/utils/dynamic-prop';
import {Component} from 'solid-js';
import {omitProps} from 'solid-use';
import {styled} from '../../utils';
import * as styles from './NativeColorPicker.css';

type ColorPickerProps = {
  value?: string;
  onChange?: (value: string) => void;
} & WithRef<'input'> &
  Omit<DynamicProps<'input'>, 'as' | 'ref' | 'onInput' | 'onChange' | 'value'>;

export const NativeColorPicker: Component<ColorPickerProps> = props => {
  function onChange(e: Event): void {
    if (props.onChange) {
      const target = e.target as HTMLInputElement;
      props.onChange(target.value);
    }
  }

  return (
    <styled.input
      component={'input'}
      class={styles.colorPicker}
      value={props.value}
      onInput={onChange}
      onChange={onChange}
      type={'color'}
      {...omitProps(props, ['class', 'type', 'value', 'onChange'])}
    />
  );
};
