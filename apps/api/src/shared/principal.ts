declare const userIdBrand: unique symbol;

export type UserId = string & {readonly [userIdBrand]: true};

export function asUserId(raw: string): UserId {
  return raw as UserId;
}

export type Credential = {readonly type: 'session'};

export interface Actor {
  readonly kind: 'user';
  readonly userId: UserId;
  readonly credential: Credential;
}

export interface Anonymous {
  readonly kind: 'anonymous';
}

export const anonymous: Anonymous = Object.freeze({kind: 'anonymous'});

export type Principal = Actor | Anonymous;

export interface SessionClaims {
  readonly email: string | null;
}

export function isOwnedBy(principal: Principal, ownerId: UserId): boolean {
  return principal.kind === 'user' && principal.userId === ownerId;
}
