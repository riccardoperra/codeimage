import {Auth0Client, User} from '@auth0/auth0-spa-js';
import {UserInfoResponse} from '../../../data-access/user';

type AppState = {
  returnTo?: string;
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export class Auth0Provider {
  constructor(private readonly client: Auth0Client) {}
  async init(): Promise<UserInfoResponse | undefined> {
    try {
      let user: User | undefined;
      if (this.hasAuthParams()) {
        const {appState} = await this.client.handleRedirectCallback();
        user = await this.client.getUser();
        this.onRedirectCallback(appState);
      } else {
        await this.client.checkSession();
        user = await this.client.getUser();
      }
      if (!user) {
        return undefined;
      }
      return {
        id: user.sub,
        email: user.email,
        created_at: user.updated_at,
        picture: user.picture,
        user_id: user.sub,
        email_verified: user.email_verified,
      } as UserInfoResponse;
    } catch (e) {}
  }

  async logout(): Promise<void> {
    await this.client.logout({
      logoutParams: {
        returnTo: `${window.location.protocol}//${window.location.host}`,
      },
    });
  }

  async getJwt(): Promise<string> {
    // TODO: handle error
    return await this.client.getTokenSilently();
  }

  async login() {
    return this.client.loginWithRedirect({
      authorizationParams: {
        connection: 'github',
      },
    });
  }

  private hasAuthParams(): boolean {
    const CODE_RE = /[?&]code=[^&]+/;
    const STATE_RE = /[?&]state=[^&]+/;
    const ERROR_RE = /[?&]error=[^&]+/;

    const searchParams = window.location.search;
    return (
      (CODE_RE.test(searchParams) || ERROR_RE.test(searchParams)) &&
      STATE_RE.test(searchParams)
    );
  }

  private onRedirectCallback(appState?: AppState) {
    window.history.replaceState(
      {},
      document.title,
      appState?.returnTo || window.location.pathname,
    );
  }
}
