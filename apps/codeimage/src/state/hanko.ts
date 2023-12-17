import * as webauthn from '@github/webauthn-json';
import {finalizePasskeyLogin, startPasskeyLogin} from '../data-access/passkey';

interface SessionDetail {
  userID: string;
  expirationSeconds: number;
  jwt: string;
}

export class HankoAuthProvider {
  static storageKey = 'passkeyState';

  static async login(): Promise<SessionDetail | null> {
    const requestJSON = await startPasskeyLogin();
    const credential = await webauthn.get(requestJSON as any);
    const response = await finalizePasskeyLogin(credential as any);
    if (!response || !response.token) {
      return null;
    }

    const {token} = response;
    const jwtClaims = JSON.parse(atob(token.split('.')[1]));

    const sessionDetail: SessionDetail = {
      jwt: token,
      expirationSeconds: jwtClaims.exp,
      userID: jwtClaims.sub,
    };

    localStorage.setItem(this.storageKey, JSON.stringify(sessionDetail));

    return sessionDetail;
  }

  private static validate(detail: SessionDetail): boolean {
    return !!(detail.expirationSeconds > 0 && detail.userID?.length);
  }

  login(): Promise<SessionDetail | null> {
    return HankoAuthProvider.login().then(sessionDetail => {
      localStorage.setItem(
        HankoAuthProvider.storageKey,
        JSON.stringify(sessionDetail),
      );
      return sessionDetail;
    });
  }

  async initLogin(): Promise<SessionDetail | null> {
    const session = this.getSession();
    if (!session) return null;
    const validate = HankoAuthProvider.validate(session);
    return validate ? session : null;
  }

  loggedIn(): boolean {
    const session = this.getSession();
    if (!session) return false;
    return HankoAuthProvider.validate(session);
  }

  signOut(): void {
    localStorage.removeItem(HankoAuthProvider.storageKey);
    window.location.reload();
  }

  getToken(): Promise<string> {
    const session = this.getSession();
    console.log('get session', session);
    return Promise.resolve(session?.jwt ?? '');
  }

  getSession(): SessionDetail | null {
    const state = localStorage.getItem(HankoAuthProvider.storageKey);
    if (!state) return null;
    const parsedState = JSON.parse(state);
    const haveKeys = ['userID', 'expirationSeconds', 'jwt'].every(key =>
      parsedState.hasOwnProperty(key),
    );
    if (!haveKeys) {
      localStorage.removeItem(HankoAuthProvider.storageKey);
      return null;
    }
    return parsedState satisfies SessionDetail;
  }

  static supported(): boolean {
    return !!(
      !!navigator.credentials &&
      !!navigator.credentials.create &&
      !!navigator.credentials.get &&
      window.PublicKeyCredential
    );
  }
}
