import {Component, createMemo} from 'solid-js';
import * as styles from './TextField.css';
import {useText, UseTextProps} from '@codeimage/ui';
import clsx from 'clsx';
import {
  DynamicProps,
  WithRef,
} from 'solid-headless/dist/types/utils/dynamic-prop';
import {omitProps} from 'solid-use';

export type TextFieldProps = {
  type: 'text' | 'number';
  value?: string | number;
  onChange?: (value: string) => void;
  size?: UseTextProps['size'];
} & WithRef<'input'> &
  Omit<DynamicProps<'input'>, 'as' | 'ref' | 'onInput' | 'onChange' | 'type'>;

export const TextField: Component<TextFieldProps> = props => {
  function onChange(e: Event): void {
    if (props.onChange) {
      const target = e.target as HTMLInputElement;
      props.onChange(String(target.value));
    }
  }

  const textStyles = createMemo(() => useText({size: props.size}));

  return (
    <input
      value={props.value}
      type={props.type}
      class={clsx(textStyles(), styles.textField, props.class)}
      onInput={onChange}
      onChange={onChange}
      {...omitProps(props, ['class', 'type', 'value', 'onChange'])}
    />
  );
};
