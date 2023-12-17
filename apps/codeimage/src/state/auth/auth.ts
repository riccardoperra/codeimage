import {Auth0Provider} from '@codeimage/store/auth/providers/auth0.provider';
import {HankoPasskeyAuthProvider} from '@codeimage/store/auth/providers/hanko-passkey.provider';
import {auth0, createAuth0Client} from '@core/constants/auth0';
import {createControlledDialog} from '@core/hooks/createControlledDialog';
import {defineSignal} from 'statebuilder';
import {LoginDialog} from '../../components/Toolbar/LoginDialog';
import {UserInfoResponse} from '../../data-access/user';

export interface AuthState {
  user: UserInfoResponse | null;
  strategy: 'auth0' | 'passkey' | null;
}

export const AuthState = defineSignal<AuthState>(() => ({
  user: null,
  strategy: null,
})).extend(_ => {
  const providers = {} as {
    hankoPasskey: HankoPasskeyAuthProvider;
    auth0: Auth0Provider;
  };

  async function init() {
    // Init providers
    await Promise.all([
      createAuth0Client().then(client => new Auth0Provider(client)),
      import('./providers/hanko-passkey.provider').then(
        m => new m.HankoPasskeyAuthProvider(),
      ),
    ]).then(([auth0Provider, hankoPasskeyProvider]) => {
      providers.hankoPasskey = hankoPasskeyProvider;
      providers.auth0 = auth0Provider;
      return;
    });

    // Determine which provider to use thanks to session;
    // TODO: fix
    const strategy: 'passkey' | 'auth0' = localStorage.getItem(
      'auth_strategy',
    ) as any;

    let user: UserInfoResponse | undefined;
    if (strategy === 'passkey') {
      user = await providers.hankoPasskey.init();
    } else if (strategy === 'auth0') {
      user = await providers.auth0.init();
    }
    _.set(value => ({
      ...value,
      user: user ?? null,
    }));
  }

  const currentProvider = () => {
    const strategy = localStorage.getItem('auth_strategy');
    switch (strategy) {
      case 'auth0':
        return providers.auth0;
      case 'passkey':
        return providers.hankoPasskey;
      default:
        throw new Error('Auth provider is not present');
    }
  };

  return {
    init,
    getToken: () => currentProvider().getJwt(),
    loggedIn: () => _().user,
    signOut: async () => {
      await currentProvider().logout();
      localStorage.removeItem('auth_strategy');
    },
    openLoginPopup() {
      const openDialog = createControlledDialog();
      return openDialog(LoginDialog, {});
    },
    providers: {
      auth0: {
        loginWithGithub: () =>
          providers.auth0.login().then(() => {
            localStorage.setItem('auth_strategy', 'auth0');
          }),
      },
      hanko: {
        login: async () => {
          const detail = await providers.hankoPasskey.login();
          localStorage.setItem('auth_strategy', 'passkey');
          if (!detail) {
            return;
          }
          window.location.reload();
        },
      },
    },
  };
});
