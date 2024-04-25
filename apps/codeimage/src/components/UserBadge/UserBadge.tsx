import {AuthState} from '@codeimage/store/auth/auth';
import {provideAppState} from '@codeimage/store/index';
import {Badge} from '@codeimage/ui';
import {ParentProps, Show} from 'solid-js';
import * as styles from './UserBadge.css';

export function UserBadge(props: ParentProps) {
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
    <Badge theme={styles.badge} size={'md'} {...props}>
      {initials()}
      <Show when={profileImage()}>
        <img class={styles.badgePicture} src={profileImage()} />
      </Show>
    </Badge>
  );
}
