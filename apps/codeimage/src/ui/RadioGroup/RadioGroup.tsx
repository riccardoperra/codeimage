import {createId} from '@core/helpers/create-id';
import type {JSX} from '@solidjs/web';
import clsx from 'clsx';
import {createContext, omit, useContext} from 'solid-js';
import * as styles from './RadioGroup.css';

type ContainerProps = JSX.HTMLAttributes<HTMLDivElement>;
type RadioGroupProps = Omit<ContainerProps, 'onChange'> & {
  value?: string;
  disabled?: boolean;
  onChange?(value: string): void;
};

interface GroupContext {
  name: string;
  label: string;
  disabled(): boolean;
  selected(value: string): boolean;
  choose(value: string): void;
}

interface ItemContext {
  id: string;
  value(): string;
  checked(): boolean;
  disabled(): boolean;
}

const Group = createContext<GroupContext>();
const Item = createContext<ItemContext>();

function RadioGroupRoot(props: RadioGroupProps) {
  const name = createId();
  const label = `${name}-label`;
  const context = {
    name,
    label,
    disabled: () => props.disabled ?? false,
    selected: (value: string) => props.value === value,
    choose: (value: string) => props.onChange?.(value),
  };
  return (
    <Group value={context}>
      <div
        {...omit(props, 'value', 'onChange', 'disabled')}
        role="radiogroup"
        aria-disabled={context.disabled() ? 'true' : undefined}
        aria-labelledby={props['aria-label'] ? undefined : label}
      />
    </Group>
  );
}

function RadioGroupItem(
  props: ContainerProps & {value: string; disabled?: boolean},
) {
  const group = useContext(Group);
  const context = {
    id: createId(),
    value: () => props.value,
    checked: () => group.selected(props.value),
    disabled: () => group.disabled() || !!props.disabled,
  };
  return (
    <Item value={context}>
      <div
        {...omit(props, 'value', 'disabled')}
        data-checked={context.checked() || undefined}
        data-disabled={context.disabled() || undefined}
      />
    </Item>
  );
}

function ItemInput(props: JSX.InputHTMLAttributes<HTMLInputElement>) {
  const group = useContext(Group);
  const item = useContext(Item);
  return (
    <input
      {...props}
      class={clsx(styles.input, props.class)}
      type="radio"
      id={item.id}
      name={group.name}
      value={item.value()}
      checked={item.checked()}
      disabled={item.disabled()}
      onChange={() => group.choose(item.value())}
    />
  );
}

function ItemLabel(props: JSX.LabelHTMLAttributes<HTMLLabelElement>) {
  const item = useContext(Item);
  return (
    <label
      {...props}
      for={item.id}
      data-checked={item.checked() || undefined}
    />
  );
}

function Label(props: ContainerProps) {
  const group = useContext(Group);
  return <div {...props} id={group.label} />;
}

function ItemControl(props: ContainerProps) {
  const item = useContext(Item);
  return (
    <div
      {...props}
      data-checked={item.checked() || undefined}
      aria-hidden="true"
    />
  );
}

export const RadioGroup = Object.assign(RadioGroupRoot, {
  Item: RadioGroupItem,
  ItemInput,
  ItemLabel,
  ItemControl,
  ItemIndicator: ItemControl,
  Label,
});
