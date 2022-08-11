import type {LogoutOptions, RedirectLoginOptions} from '@auth0/auth0-spa-js';
import type Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client';

export interface Auth0State {
  auth0Client: () => Auth0Client | undefined;
  isInitialized: () => boolean;
  isAuthenticated: () => boolean;
  user: () => any;
  loginWithRedirect: (options?: RedirectLoginOptions) => Promise<void>;
  logout: (options?: LogoutOptions) => Promise<void>;
  getToken(): Promise<string>;
}
