import {Menu, MenuItem, PopoverPanel, PopoverPanelProps} from 'solid-headless';
import {Component, Show} from 'solid-js';
import * as styles from './Dropdown.css';
import {sprinkles} from '../../../theme/sprinkles.css';
import {Text} from '../Text/Text';

type DropdownMenuPanel = PopoverPanelProps<'div'> & {
  title?: string;
};

export const DropdownMenu: Component<DropdownMenuPanel> = props => {
  return (
    <div>
      <PopoverPanel
        as={'div'}
        unmount={false}
        class={styles.dropdownPanel}
        {...props}
      >
        <div class={sprinkles({display: 'flex', padding: '3'})}>
          <Show when={props.title}>
            <Text as={'div'} weight="semibold" size={'sm'}>
              {props.title}
            </Text>
          </Show>
        </div>

        <Menu>
          <MenuItem as={'div'}>{props.children}</MenuItem>
        </Menu>
      </PopoverPanel>
    </div>
  );
};
