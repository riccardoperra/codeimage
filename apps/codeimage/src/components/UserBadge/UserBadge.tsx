import {AuthState} from '@codeimage/store/auth/auth';
import {provideAppState} from '@codeimage/store/index';
import {Badge} from '@codeimage/ui';
import {
  As,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@codeui/kit';
import {Show} from 'solid-js';
import * as styles from './UserBadge.css';

export function UserBadge() {
  const authState = provideAppState(AuthState);
  const user = () => authState().user;
  const profileImage = () => user()?.picture;

  const initials = () => {
    const userValue = user();
    if (!userValue) return;
    const [first = '', last = ''] = (userValue.name ?? '').split(' ');
    return [first, last]
      .filter(data => !!data)
      .map(data => data[0])
      .join('');
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
          <As component={Badge} theme={styles.badge} size={'md'}>
            {initials()}
            <Show when={profileImage()}>
              <img class={styles.badgePicture} src={profileImage()} />
            </Show>
          </As>
        </DropdownMenuTrigger>

        <DropdownMenuPortal>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => authState.signOut()}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    </Show>
  );
}
