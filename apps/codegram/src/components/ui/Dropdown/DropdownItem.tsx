import * as styles from './Dropdown.css';
import {JSXElement} from 'solid-js';
import clsx from 'clsx';
import {MenuItem, MenuItemProps} from 'solid-headless';

type DropdownItemProps = MenuItemProps<'button'> & {
  active?: boolean;
};

export function DropdownItem(props: DropdownItemProps): JSXElement {
  return (
    <MenuItem
      {...props}
      as={'button'}
      aria-selected={props.active ?? false}
      class={clsx(styles.dropdownMenuButton, props.class)}
    >
      {props.children}
    </MenuItem>
  );
}
