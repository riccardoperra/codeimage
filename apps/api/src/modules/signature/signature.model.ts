import {defineErrors} from '../../shared/errors.js';
import type {UserId} from '../../shared/principal.js';
import type {SignatureData} from './signature.contract.js';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | JsonObject;

export type JsonObject = {readonly [key in string]?: JsonValue};

export interface Signature {
  readonly id: string;
  readonly ownerId: UserId;
  readonly name: string;
  readonly isDefault: boolean;
  readonly version: number;
  readonly data: JsonObject;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SignatureDraft {
  readonly name: string;
  readonly data: SignatureData;
  readonly isDefault?: boolean;
}

export interface SignatureChanges {
  readonly name?: string;
  readonly data?: SignatureData;
  readonly isDefault?: boolean;
}

export const SignatureErrors = defineErrors({
  notFound: {
    code: 'NotFoundSignatureException',
    kind: 'not_found',
    message: (p: {id: string; ownerId: UserId}) =>
      `Signature with id ${p.id} for user ${p.ownerId} not found`,
  },
  limitExceeded: {
    code: 'ExceedSignatureLimitException',
    kind: 'unprocessable',
    message: (_: {limit: number}) => 'Signature limit per account exceeded',
  },
});

/** True when one more signature would pass the limit. 0 disables the check. */
export function reachesSignatureLimit(
  existing: number,
  limit: number,
): boolean {
  return limit !== 0 && existing >= limit;
}
