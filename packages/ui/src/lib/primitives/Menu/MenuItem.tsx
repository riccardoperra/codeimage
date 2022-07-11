import {AriaMenuItemProps, createMenuItem} from '@solid-aria/menu';
import {ParentProps} from 'solid-js';
import * as styles from './MenuItem.css';

export function MenuItem(props: ParentProps<AriaMenuItemProps>) {
  let ref: HTMLLIElement | undefined;

  // Get props for the menu item element
  const {menuItemProps, isFocused, isSelected} = createMenuItem(
    props,
    () => ref,
  );

  return (
    <li
      {...menuItemProps}
      ref={ref}
      class={styles.menuItem}
      aria-selected={isSelected()}
      data-focused={isFocused()}
    >
      {props.children}
    </li>
  );
}
