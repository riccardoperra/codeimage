import {User} from '@auth0/auth0-spa-js';
import {auth0} from '@core/constants/auth0';
import {createEffect, createRoot, createSignal, onMount} from 'solid-js';

type AuthState = User | null;

export function $auth0State() {
  const [state, setState] = createSignal<AuthState>();

  onMount(async () => {
    const queryParams = new URLSearchParams(window.location.search);

    await auth0.checkSession();
    const isAuthenticated = await auth0.isAuthenticated();

    if (queryParams.has('code') && queryParams.has('state')) {
      const data = await auth0.handleRedirectCallback().catch(e => {
        console.log('TEST ERROR', e);
        return null;
      });
      if (data) {
        // should be null
        return;
      }
    }

    if (isAuthenticated) {
      const user = await auth0.getUser();
      setState(user);
    }
  });

  async function login() {
    auth0.loginWithRedirect({connection: 'github'});
  }

  async function isAuth() {
    try {
      const isAuth = await auth0.isAuthenticated();
      console.log('user', isAuth);
      return isAuth;
    } catch {
      console.error('Error getting user');
      return undefined;
    }
  }

  async function signOut() {
    await auth0.logout({returnTo: 'http://localhost:4200'});
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
    isAuth,
  };
}

const auth0State = createRoot($auth0State);

export function getAuth0State() {
  return auth0State;
}
