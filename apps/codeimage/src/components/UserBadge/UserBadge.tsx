import {getAuth0State} from '@codeimage/store/auth/auth0';
import {Badge, DropdownMenuV2, MenuButton} from '@codeimage/ui';
import {Item} from '@solid-aria/collection';
import {GithubLoginButton} from '@ui/GithubLoginButton/GithubLoginButton';
import {Show} from 'solid-js';
import * as styles from './UserBadge.css';

export function UserBadge() {
  const {loggedIn, login, user, signOut} = getAuth0State();
  const profileImage = () => user()?.picture;

  const initials = () => {
    const $user = user();
    if (!$user) return;
    const [first = '', last = ''] = ($user.name ?? '').split(' ');
    return [first, last]
      .filter(data => !!data)
      .map(data => data[0])
      .join('');
  };

  function onAction(key: string | number) {
    switch (key) {
      case 'logout': {
        signOut();
      }
    }
  }

  return (
    <Show fallback={<GithubLoginButton onClick={login} />} when={loggedIn()}>
      <DropdownMenuV2
        onAction={onAction}
        menuButton={
          <MenuButton as={Badge} theme={styles.badge} size={'md'}>
            {initials()}
            <Show when={profileImage()}>
              <img class={styles.badgePicture} src={profileImage()} />
            </Show>
          </MenuButton>
        }
      >
        <Item key={'logout'}>Logout</Item>
      </DropdownMenuV2>
    </Show>
  );
}
