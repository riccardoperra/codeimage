import {createMemo, PropsWithChildren} from 'solid-js';
import {textField} from './TextField.css';
import clsx from 'clsx';
import {
  DynamicProps,
  WithRef,
} from 'solid-headless/dist/types/utils/dynamic-prop';
import {omitProps} from 'solid-use';
import {useText, UseTextProps} from '../Text';
import {Dynamic} from 'solid-js/web';

export type TextFieldProps = {
  type: 'text' | 'number';
  value?: string | number;
  onChange?: (value: string) => void;
  size?: UseTextProps['size'];
} & WithRef<'input'> &
  Omit<DynamicProps<'input'>, 'as' | 'ref' | 'onInput' | 'onChange' | 'type'>;

export function TextField(props: PropsWithChildren<TextFieldProps>) {
  function onChange(e: Event): void {
    if (props.onChange) {
      const target = e.target as HTMLInputElement;
      props.onChange(String(target.value));
    }
  }

  const classes = createMemo(() =>
    clsx(useText({size: props.size}), textField, props.class),
  );

  return (
    <Dynamic
      component={'input'}
      value={props.value}
      type={props.type}
      class={classes()}
      onInput={onChange}
      onChange={onChange}
      {...omitProps(props, ['class', 'type', 'value', 'onChange'])}
    />
  );
}
