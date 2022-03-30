import {Menu, MenuItem, PopoverPanel, PopoverPanelProps} from 'solid-headless';
import {Component, Show} from 'solid-js';
import * as styles from './Dropdown.css';
import {Text} from '../Text/Text';
import {Box} from '../Box/Box';

type DropdownMenuPanel = PopoverPanelProps<'div'> & {
  title?: string;
};

export const DropdownMenu: Component<DropdownMenuPanel> = props => {
  return (
    <PopoverPanel
      as={'div'}
      unmount={false}
      class={styles.dropdownPanel}
      {...props}
    >
      <Box display={'flex'} padding={'3'}>
        <Show when={props.title}>
          <Text as={'div'} weight="semibold" size={'sm'}>
            {props.title}
          </Text>
        </Show>
      </Box>

      <Menu>
        <MenuItem as={'div'}>{props.children}</MenuItem>
      </Menu>
    </PopoverPanel>
  );
};
