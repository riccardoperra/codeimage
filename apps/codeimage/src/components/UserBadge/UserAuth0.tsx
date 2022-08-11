import {getAuth0State} from '@codeimage/store/auth/auth0';
import {Badge, Button} from '@codeimage/ui';
import {Show} from 'solid-js';
import {badge} from './UserBadge.css';

export function UserAuth0() {
  const {loggedIn, login, user, getUser, signOut, userResource} =
    getAuth0State();
  const name = () => user()?.nickname as string | null;
  const initials = () => {
    const $name = name();
    if (!$name) {
      return null;
    }
    // const [first = '', last = ''] = $name.split('', 1);
    return $name.split('', 1);
  };

  return (
    <Show
      fallback={
        <>
          <Button
            theme={'secondary'}
            variant={'solid'}
            onClick={() => console.log(getUser())}
          >
            USER
          </Button>
          <Button
            theme={'secondary'}
            variant={'solid'}
            onClick={e => {
              e.preventDefault();
              return login();
            }}
          >
            Sign AUTH0
          </Button>
          <Button
            theme={'secondary'}
            variant={'solid'}
            onClick={e => {
              e.preventDefault();
              return signOut();
            }}
          >
            Sign out
          </Button>
        </>
      }
      when={loggedIn()}
    >
      <Badge theme={badge} size={'md'}>
        {initials()}
      </Badge>
      <pre>{JSON.stringify(userResource())}</pre>
    </Show>
  );
}
