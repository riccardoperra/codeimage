import clsx from 'clsx';
import {
  DynamicProps,
  WithRef,
} from 'solid-headless/dist/types/utils/dynamic-prop';
import {createMemo, PropsWithChildren} from 'solid-js';
import {omitProps} from 'solid-use';
import {styled} from '../../utils';
import {useText, UseTextProps} from '../Text';
import {textField, TextFieldProps as $TextFieldProps} from './TextField.css';

export type TextFieldProps = {
  type: 'text' | 'number';
  value?: string | number;
  onChange?: (value: string) => void;
  size?: UseTextProps['size'];
} & $TextFieldProps &
  WithRef<'input'> &
  Omit<DynamicProps<'input'>, 'as' | 'ref' | 'onInput' | 'onChange' | 'type'>;

export function TextField(props: PropsWithChildren<TextFieldProps>) {
  function onChange(e: Event): void {
    if (props.onChange) {
      const target = e.target as HTMLInputElement;
      props.onChange(String(target.value));
    }
  }

  const classes = createMemo(() =>
    clsx(
      useText({size: props.size}),
      textField({inline: props.inline ?? false}),
      props.class,
    ),
  );

  return (
    <styled.input
      value={props.value}
      type={props.type}
      class={classes()}
      onInput={onChange}
      onChange={onChange}
      {...omitProps(props, ['class', 'type', 'value', 'onChange'])}
    />
  );
}
