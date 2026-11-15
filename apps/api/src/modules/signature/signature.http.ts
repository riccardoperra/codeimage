import {Value} from '@sinclair/typebox/value';
import {
  SignatureDataSchema,
  type SignatureResponse,
} from './signature.contract.js';
import type {Signature} from './signature.model.js';

export function toSignatureResponse(signature: Signature): SignatureResponse {
  const {data} = signature;
  if (!Value.Check(SignatureDataSchema, data)) {
    throw new Error(
      `Signature ${signature.id}: stored data does not match SignatureDataSchema`,
    );
  }
  return {
    id: signature.id,
    name: signature.name,
    isDefault: signature.isDefault,
    createdAt: signature.createdAt,
    updatedAt: signature.updatedAt,
    version: signature.version,
    data,
  };
}
