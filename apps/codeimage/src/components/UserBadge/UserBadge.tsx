import {getAuthState} from '@codeimage/store/auth/auth';
import {Badge, Button} from '@codeimage/ui';
import {Show} from 'solid-js';
import {badge} from './UserBadge.css';

export function UserBadge() {
  const {loggedIn, signInWithGithub, user} = getAuthState();
  const name = () => user()?.user?.user_metadata.name as string | null;
  const initials = () => {
    const $name = name();
    if (!$name) {
      return null;
    }
    const [first = '', last = ''] = $name.split(' ');
    return `${first[0]}${last[0]}`;
  };

  return (
    <Show
      fallback={
        <Button
          theme={'secondary'}
          variant={'solid'}
          onClick={() => signInWithGithub()}
        >
          Sign in with GitHub
        </Button>
      }
      when={loggedIn()}
    >
      <Badge theme={badge} size={'md'}>
        {initials()}
      </Badge>
    </Show>
  );
}
