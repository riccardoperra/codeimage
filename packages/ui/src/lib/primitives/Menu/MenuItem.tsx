import {AriaMenuItemProps, createMenuItem} from '@solid-aria/menu';
import {ParentProps} from 'solid-js';
import {styled} from '../../utils';
import * as styles from './MenuItem.css';

export function MenuItem(props: ParentProps<AriaMenuItemProps>) {
  let ref: HTMLLIElement | undefined;

  // Get props for the menu item element
  const {menuItemProps, isFocused, isSelected} = createMenuItem(
    props,
    () => ref,
  );

  return (
    <styled.li
      {...menuItemProps}
      ref={ref}
      class={styles.menuItem}
      aria-selected={isSelected()}
      data-focused={isFocused()}
    >
      {props.children}
    </styled.li>
  );
}
