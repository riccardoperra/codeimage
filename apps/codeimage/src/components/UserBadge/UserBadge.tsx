import {getAuthState} from '@codeimage/store/auth/auth';
import {Badge, Button} from '@codeimage/ui';
import {Show} from 'solid-js';
import {badge} from './UserBadge.css';

export function UserBadge() {
  const {loggedIn, signInWithGithub, user} = getAuthState();
  const profileImage = () => user()?.user?.user_metadata.avatar_url;

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
        <img width={36} height={36} src={profileImage()} />
      </Badge>
    </Show>
  );
}
