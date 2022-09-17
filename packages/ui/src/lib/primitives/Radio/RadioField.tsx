import {
  AriaRadioGroupProps,
  AriaRadioProps,
  createRadio,
  createRadioGroup,
} from '@solid-aria/radio';
import {Group} from '../Group';

import * as styles from './RadioField.css';

type RadioGroupFieldProps = AriaRadioGroupProps;

export function RadioGroupField(props: RadioGroupFieldProps) {
  const {RadioGroupProvider, groupProps, labelProps} = createRadioGroup(props);

  return (
    <Group
      {...groupProps}
      orientation={props.orientation}
      class={styles.radioGroup}
    >
      <span {...labelProps}>{props.label}</span>
      <RadioGroupProvider>{props.children}</RadioGroupProvider>
    </Group>
  );
}

export function RadioField(props: AriaRadioProps) {
  let ref: HTMLInputElement | undefined;

  const {inputProps} = createRadio(props, () => ref);

  return (
    <label class={styles.radioWrapper}>
      <input {...inputProps} ref={ref} class={styles.radio} />
      {props.children}
    </label>
  );
}
