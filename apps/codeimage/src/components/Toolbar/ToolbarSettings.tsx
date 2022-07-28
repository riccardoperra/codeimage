import {getAuthState} from '@codeimage/store/auth/auth';
import {
  Button,
  createStandaloneDialog,
  DropdownMenuV2,
  MenuButton,
} from '@codeimage/ui';
import {supabase} from '@core/constants/supabase';
import {Item} from '@solid-aria/collection';
import {useNavigate} from 'solid-app-router';
import {Show} from 'solid-js';
import {DotHorizontalIocn, MenuAlt2Icon} from '../Icons/DotVertical';
import {SettingsDialog} from './SettingsDialog';

export function ToolbarSettingsButton() {
  const navigate = useNavigate();
  const createDialog = createStandaloneDialog();

  const onMenuAction = (item: string | number) => {
    switch (item) {
      case 'logout':
        supabase.auth.signOut().then(() => navigate('/'));
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
          as={Button}
          pill={true}
          style={{width: '30px', height: '30px'}}
          variant={'solid'}
          size={'xs'}
          theme={'secondary'}
        >
          <MenuAlt2Icon />
        </MenuButton>
      }
    >
      <Item key={'settings'}>Settings</Item>
      <Show when={getAuthState().loggedIn()}>
        <Item key={'logout'}>Logout</Item>
      </Show>
    </DropdownMenuV2>
  );
}
