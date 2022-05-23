import {
  Menu,
  PopoverPanel as ShPopoverPanel,
  PopoverPanelProps,
} from 'solid-headless';
import {FlowComponent} from 'solid-js';
import * as styles from './Dropdown.css';

type DropdownMenuPanel = PopoverPanelProps<'div'>;

export const DropdownMenu: FlowComponent<DropdownMenuPanel> = props => {
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

export const PopoverPanel: FlowComponent<DropdownMenuPanel> = props => {
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
