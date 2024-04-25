import * as webauthn from '@github/webauthn-json';
import {cookieStorage} from '@solid-primitives/storage';
import {jwtDecode} from 'jwt-decode';
import {
  finalizePasskeyLogin,
  finalizePasskeyRegistration,
  startPasskeyLogin,
  startPasskeyRegistration,
} from '../../../data-access/passkey';
import {getUserInfo} from '../../../data-access/user';

interface SessionDetail {
  userID: string;
  expirationSeconds: number;
  jwt: string;
}

export class HankoPasskeyAuthProvider {
  private readonly state = new HankoPasskeyAuthSessionState();

  async init() {
    try {
      const session = this.checkSession();
      if (!session) return;
      return getUserInfo(session.jwt);
    } catch (e) {}
  }

  async logout(): Promise<void> {
    this.state.setJwtSession(null);
    window.location.reload();
  }

  async getJwt(): Promise<string | null> {
    return this.state.getJwt()?.jwt ?? null;
  }

  async login(): Promise<SessionDetail | null> {
    const requestJSON = await startPasskeyLogin();
    const credential = await webauthn.get(requestJSON as any);
    const response = await finalizePasskeyLogin(credential as any);
    if (!response || !response.token) {
      return null;
    }
    const {token} = response;
    const session = this.getSessionFromToken(token);
    this.state.setJwtSession(token);
    return session;
  }

  async getSessionFromToken(token: string) {
    const jwtClaims = JSON.parse(atob(token.split('.')[1]));
    return {
      jwt: token,
      expirationSeconds: jwtClaims.exp,
      userID: jwtClaims.sub,
    };
  }

  async registerPasskey(): Promise<{token?: string | undefined}> {
    try {
      const credentials = await startPasskeyRegistration();
      const attestation = await webauthn.create(credentials);
      const response = await finalizePasskeyRegistration(attestation);
      if (!response || !response.token) {
        this.state.setJwtSession(null);
        return response;
      }
      this.state.setJwtSession(response.token);
      return response;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  checkSession(): SessionDetail | null {
    const data = this.state.getJwt();
    if (!data) {
      this.state.setJwtSession(null);
      return null;
    }
    // todo check validation
    return {
      jwt: data.jwt,
      userID: data.decodedJwt.sub as string,
      expirationSeconds: HankoPasskeyAuthProvider.timeToRemainingSeconds(
        data.decodedJwt.exp,
      ),
    };
  }

  static timeToRemainingSeconds(time = 0) {
    return time - Math.floor(Date.now() / 1000);
  }

  static remainingSecondsToTime(seconds = 0) {
    return Math.floor(Date.now() / 1000) + seconds;
  }
}

class HankoPasskeyAuthSessionState {
  private readonly storageJwtKey = 'codeimagePasskey';
  private readonly jwtStorage = cookieStorage;

  setJwtSession(jwt: string | null): void {
    if (!jwt) {
      console.debug(
        '[CodeImage/HankoPasskeyAuthSessionState] setSession to null',
      );
      this.jwtStorage.removeItem(this.storageJwtKey);
      return;
    }
    this.jwtStorage.setItem(this.storageJwtKey, jwt);
  }

  getJwt() {
    const data = this.jwtStorage.getItem(this.storageJwtKey);
    if (!data) return null;
    try {
      const decodedJwt = jwtDecode(data, {header: false});
      if (!decodedJwt['sub'] || decodedJwt['exp'] === undefined) {
        return null;
      }
      return {
        jwt: data,
        decodedJwt,
      };
    } catch (e) {
      console.debug(
        '[CodeImage/HankoPasskeyAuthSessionState] error while decoding session from jwt',
        {error: e},
      );
      return null;
    }
  }
}
