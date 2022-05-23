import {
  Menu,
  PopoverPanel as ShPopoverPanel,
  PopoverPanelProps,
} from 'solid-headless';
import {Component, ParentComponent} from 'solid-js';
import * as styles from './Dropdown.css';

type DropdownMenuPanel = PopoverPanelProps<'div'>;

export const DropdownMenu: ParentComponent<DropdownMenuPanel> = props => {
  return (
    <ShPopoverPanel
      as={'div'}
      unmount={false}
      class={styles.dropdownMenuPanel}
      {...props}
    >
      <Menu as={'ul'} class={styles.dropdownMenu}>
        {props.children}
      </Menu>
    </ShPopoverPanel>
  );
};

export const PopoverPanel: Component<DropdownMenuPanel> = props => {
  return (
    <ShPopoverPanel
      as={'div'}
      unmount={false}
      class={styles.dropdownMenuPanel}
      {...props}
    >
      {props.children}
    </ShPopoverPanel>
  );
};
