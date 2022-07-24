import {supabase} from '@core/constants/supabase';
import {Session as UserSession} from '@supabase/supabase-js';
import {createRoot, createSignal} from 'solid-js';

type AuthState = UserSession | null;

export function $authState() {
  const [state, setState] = createSignal<AuthState>();

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      setState(session);
    }
    if (event === 'SIGNED_OUT') {
      setState(null);
    }
  });

  async function signInWithGithub() {
    await supabase.auth.signIn({
      provider: 'github',
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const loggedIn = () => !!state();

  return {
    user: state,
    signInWithGithub,
    signOut,
    loggedIn,
  };
}

const authState = createRoot($authState);

export function getAuthState() {
  return authState;
}
