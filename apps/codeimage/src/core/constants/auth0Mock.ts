import {Auth0Client, User} from '@auth0/auth0-spa-js';

export async function createAuth0Client(): Promise<Auth0Client> {
  let user: User | undefined = undefined;
  const auth = sessionStorage.getItem('_mockAuth');
  if (auth) {
    const authObj = JSON.parse(auth);
    if (authObj.authenticated) {
      user = {
        name: 'Guest',
        email: 'email@example.it',
        sub: 'guest|test',
      };
    }
  }
  return {
    async getUser<T extends User>(): Promise<T | undefined> {
      return user as T | undefined;
    },
    async loginWithRedirect(..._args) {
      sessionStorage.setItem(
        '_mockAuth',
        JSON.stringify({
          authenticated: true,
        }),
      );
      window.location.reload();
    },
    async logout() {
      sessionStorage.setItem(
        '_mockAuth',
        JSON.stringify({
          authenticated: false,
        }),
      );
      window.location.reload();
      user = undefined;
    },
    async isAuthenticated() {
      return !!user;
    },
    async getTokenSilently(_options) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Promise.resolve<any>({
        access_token: '_access',
        id_token: 'id_mock',
        expires_in: 99999,
        refresh_token: '_refresh',
        scope: '_',
      });
    },
    async handleRedirectCallback(..._args) {
      return {};
    },
    async checkSession(..._args) {
      void 0;
    },
  } as Auth0Client;
}
