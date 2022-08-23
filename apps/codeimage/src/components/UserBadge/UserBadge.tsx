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
    return [first, last]
      .filter(data => !!data)
      .map(data => data[0])
      .join('');
  };

  return (
    <Show fallback={<GithubLoginButton onClick={login} />} when={loggedIn()}>
      <Badge theme={styles.badge} size={'md'}>
        {initials()}
        <Show when={profileImage()}>
          <img class={styles.badgePicture} src={profileImage()} />
        </Show>
      </Badge>
    </Show>
  );
}
