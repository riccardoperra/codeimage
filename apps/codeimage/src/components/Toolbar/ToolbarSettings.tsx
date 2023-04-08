import {getAuth0State} from '@codeimage/store/auth/auth0';
import {createStandaloneDialog, IconButton} from '@codeimage/ui';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@codeui/kit';
import {As} from '@kobalte/core';
import {useNavigate} from '@solidjs/router';
import {Show} from 'solid-js';
import {MenuAlt2Icon} from '../Icons/DotVertical';
import {SettingsDialog} from './SettingsDialog';

export function ToolbarSettingsButton() {
  const navigate = useNavigate();
  const createDialog = createStandaloneDialog();
  const {signOut, loggedIn} = getAuth0State();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <As
          component={IconButton}
          pill={true}
          size={'xs'}
          variant={'solid'}
          theme={'secondary'}
        >
          <MenuAlt2Icon size={'sm'} />
        </As>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => createDialog(SettingsDialog, () => ({}))}
          >
            Settings
          </DropdownMenuItem>
          <Show when={loggedIn()}>
            <DropdownMenuItem
              onClick={() => signOut().then(() => navigate('/'))}
            >
              Item 2
            </DropdownMenuItem>
          </Show>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
