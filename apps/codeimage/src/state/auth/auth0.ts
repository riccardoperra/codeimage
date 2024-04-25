import {Auth0Client, User} from '@auth0/auth0-spa-js';
import {auth0} from '@core/constants/auth0';
import {createRoot, createSignal} from 'solid-js';

type AuthState = User | null;

function $auth0State() {
  let client!: Auth0Client;
  const [state, setState] = createSignal<AuthState>();

  async function initLogin() {
    client = await auth0;
    const queryParams = new URLSearchParams(window.location.search);
    if (!client) return;
    if (queryParams.has('code') && queryParams.has('state')) {
      const data = await client.handleRedirectCallback().catch(() => null);
      setState(await client.getUser());
      history.replaceState(data?.appState, '', window.location.origin);
      if (data) {
        // should always be null?
      }
    } else {
      if (await client.isAuthenticated()) {
        setState(await client.getUser());
      }
    }
  }

  async function login() {
    client.loginWithRedirect({
      authorizationParams: {
        connection: 'github',
      },
    });
  }

  async function forceLogin() {
    client.loginWithRedirect({
      authorizationParams: {
        prompt: 'login',
        connection: 'github',
      },
    });
  }

  async function signOut() {
    await client.logout({
      logoutParams: {
        returnTo: `${window.location.protocol}//${window.location.host}`,
      },
    });
  }

  const getToken = () => {
    return client.getTokenSilently();
  };

  const loggedIn = () => !!state();

  const user = () => {
    const $user = state();
    if (!$user) return null;
    return Object.assign($user, {
      id: $user.sub?.split('|')[1],
    });
  };

  return {
    user,
    getToken,
    login,
    forceLogin,
    signOut,
    loggedIn,
    initLogin,
  };
}

const auth0State = createRoot($auth0State);

export function getAuth0State() {
  return auth0State;
}
