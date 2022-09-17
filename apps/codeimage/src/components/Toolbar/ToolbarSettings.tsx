import {getAuth0State} from '@codeimage/store/auth/auth0';
import {
  createStandaloneDialog,
  DropdownMenuV2,
  IconButton,
  MenuButton,
} from '@codeimage/ui';
import {Item} from '@solid-aria/collection';
import {useNavigate} from '@solidjs/router';
import {Show} from 'solid-js';
import {MenuAlt2Icon} from '../Icons/DotVertical';
import {SettingsDialog} from './SettingsDialog';

export function ToolbarSettingsButton() {
  const navigate = useNavigate();
  const createDialog = createStandaloneDialog();
  const {signOut, loggedIn} = getAuth0State();

  const onMenuAction = (item: string | number) => {
    switch (item) {
      case 'logout':
        signOut().then(() => navigate('/'));
        break;
      case 'settings': {
        createDialog(SettingsDialog, () => ({}));
        break;
      }
    }
  };

  return (
    <DropdownMenuV2
      onAction={item => onMenuAction(item)}
      menuButton={
        <MenuButton
          as={IconButton}
          pill={true}
          size={'xs'}
          variant={'solid'}
          theme={'secondary'}
        >
          <MenuAlt2Icon size={'sm'} />
        </MenuButton>
      }
    >
      <Item key={'settings'}>Settings</Item>
      <Show when={loggedIn()}>
        <Item key={'logout'}>Logout</Item>
      </Show>
    </DropdownMenuV2>
  );
}
