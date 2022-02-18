import {TextField, TextFieldProps} from './TextField';
import {Component, createMemo} from 'solid-js';
import * as styles from './TextField.css';

export type InlineTextFieldProps = Omit<TextFieldProps, 'type'>;

export const InlineTextField: Component<InlineTextFieldProps> = props => {
  const value = createMemo(() => String(props.value || props.placeholder));
  const length = createMemo(() => value()?.length || 0);
  const width = createMemo(() => `${length() * 8}px`);

  return (
    <TextField
      {...props}
      type="text"
      class={styles.unstyledTextField}
      style={{width: width()}}
    />
  );
};
