import {User} from '@auth0/auth0-spa-js';
import {auth0} from '@core/constants/auth0';
import {createEffect, createRoot, createSignal} from 'solid-js';

type AuthState = User | null;

export function $auth0State() {
  const [state, setState] = createSignal<AuthState>();

  async function initLogin() {
    const queryParams = new URLSearchParams(window.location.search);

    if (queryParams.has('code') && queryParams.has('state')) {
      const data = await auth0.handleRedirectCallback().catch(() => null);
      setState(await auth0.getUser());
      history.replaceState(data?.appState, '', window.location.origin);
      if (data) {
        // should always be null?
      }
    } else {
      await auth0.checkSession();
      if (await auth0.isAuthenticated()) {
        setState(await auth0.getUser());
      }
    }
  }

  async function login() {
    auth0.loginWithRedirect({connection: 'github'});
  }

  async function signOut() {
    await auth0.logout({returnTo: window.location.origin});
  }

  const loggedIn = () => !!state();

  createEffect(() => {
    console.log('AUTH USER STATE', state());
  });

  return {
    user: state,
    login,
    signOut,
    loggedIn,
    initLogin,
  };
}

const auth0State = createRoot($auth0State);

export function getAuth0State() {
  return auth0State;
}
