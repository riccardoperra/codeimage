import {AuthState} from '@codeimage/store/auth/auth';
import {provideAppState} from '@codeimage/store/index';
import {
  As,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@codeui/kit';
import {createControlledDialog} from '@core/hooks/createControlledDialog';
import {Show} from 'solid-js';
import {ProfileDialog} from '../Toolbar/ProfileDialog/ProfileDialog';
import {UserBadge} from './UserBadge';

export function ProfileBadge() {
  const authState = provideAppState(AuthState);
  const openDialog = createControlledDialog();
  const openProfilePopup = () => {
    openDialog(ProfileDialog, {});
  };

  return (
    <Show
      fallback={
        <Button theme={'secondary'} onClick={() => authState.openLoginPopup()}>
          Login
        </Button>
      }
      when={authState.loggedIn()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <As component={UserBadge} />
        </DropdownMenuTrigger>

        <DropdownMenuPortal>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => openProfilePopup()}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => authState.signOut()}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    </Show>
  );
}
