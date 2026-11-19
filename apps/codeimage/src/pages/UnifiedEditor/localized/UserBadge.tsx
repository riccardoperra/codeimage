import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../../i18n';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {Badge} from '@codeimage/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@ui/DropdownMenu';
import {GitHubLoginButton} from './GitHubLoginButton';
import {Show} from 'solid-js';
import * as styles from '../../../components/UserBadge/UserBadge.css';

export function UserBadge() {
  const [t] = useI18n<AppLocaleEntries>();
  const {loggedIn, user, signOut} = getAuth0State();
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
    <Show fallback={<GitHubLoginButton />} when={loggedIn()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          as={Badge}
          theme={styles.badge}
          size={'md'}
          role="button"
          tabindex={0}
        >
          {initials()}
          <Show when={profileImage()}>
            <img class={styles.badgePicture} src={profileImage()} />
          </Show>
        </DropdownMenuTrigger>

        <DropdownMenuPortal>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => signOut()}>
              {t('editor.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    </Show>
  );
}
