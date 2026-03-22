import clsx from 'clsx';
import type {PropsWithChildren, Ref} from 'solid-js';
import {omitProps} from 'solid-use/props';
import {styled} from '../../utils';
import type {DynamicNode, DynamicProps} from '../Box';
import type {UseTextProps} from '../Text';
import {useText} from '../Text';
import type {TextFieldProps as $TextFieldProps} from './TextField.css';
import {textField} from './TextField.css';
export type TextFieldProps = {
  type: 'text' | 'number';
  value?: string | number;
  onChange?: (value: string) => void;
  size?: UseTextProps['size'];
  ref?: Ref<DynamicNode<'input'>>;
} & $TextFieldProps &
  Omit<DynamicProps<'input'>, 'as' | 'ref' | 'onInput' | 'onChange' | 'type'>;

export function TextField(props: PropsWithChildren<TextFieldProps>) {
  function onChange(e: Event): void {
    if (props.onChange) {
      const target = e.target as HTMLInputElement;
      props.onChange(String(target.value));
    }
  }

  const textClasses = useText(props);

  return (
    <styled.input
      value={props.value}
      type={props.type}
      class={clsx(
        textClasses(),
        textField({inline: props.inline ?? false}),
        props.class,
      )}
      onInput={onChange}
      onChange={onChange}
      {...omitProps(props, ['class', 'type', 'value', 'onChange'])}
    />
  );
}
