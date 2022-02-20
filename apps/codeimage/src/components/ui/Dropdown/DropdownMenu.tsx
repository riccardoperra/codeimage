import {Menu, PopoverPanel, PopoverPanelProps} from 'solid-headless';
import {Component} from 'solid-js';
import * as styles from './Dropdown.css';

type DropdownMenuPanel = PopoverPanelProps<'div'>;

export const DropdownMenu: Component<DropdownMenuPanel> = props => {
  return (
    <PopoverPanel
      as={'div'}
      unmount={false}
      class={styles.dropdownMenuPanel}
      {...props}
    >
      <Menu as={'ul'} class={styles.dropdownMenu}>
        {props.children}
      </Menu>
    </PopoverPanel>
  );
};
