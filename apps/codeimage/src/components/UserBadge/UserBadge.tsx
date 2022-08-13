import {getAuth0State} from '@codeimage/store/auth/auth0';
import {Badge} from '@codeimage/ui';
import {GithubLoginButton} from '@ui/GithubLoginButton/GithubLoginButton';
import {Show} from 'solid-js';
import * as styles from './UserBadge.css';

export function UserBadge() {
  const {loggedIn, login, user} = getAuth0State();
  const profileImage = () => user()?.picture;

  const initials = () => {
    const $user = user();
    if (!$user) return;
    const [first = '', last = ''] = ($user.name ?? '').split(' ');
    return `${first[0]}${last[0]}`;
  };

  return (
    <Show fallback={<GithubLoginButton onClick={login} />} when={loggedIn()}>
      <Badge theme={styles.badge} size={'md'}>
        {initials()}
        <img class={styles.badgePicture} src={profileImage()} />
      </Badge>
    </Show>
  );
}
