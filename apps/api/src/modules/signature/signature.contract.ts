import type {Static} from '@sinclair/typebox';
import {Type} from '@sinclair/typebox';
import {defineContract} from '../../shared/contract.js';
import {FrameSignatureSchema} from '../project/project.contract.js';

/** A saved signature holds the same fields a snippet's frame stores. */
export const SignatureDataSchema = Type.Omit(FrameSignatureSchema, ['savedId']);

const SignatureName = Type.String({minLength: 1, maxLength: 60});

export const SignatureSchema = Type.Object(
  {
    id: Type.String({format: 'uuid'}),
    name: Type.String(),
    isDefault: Type.Boolean(),
    createdAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    updatedAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    version: Type.Number(),
    data: SignatureDataSchema,
  },
  {title: 'SignatureResponse'},
);

export const SignatureCreateBodySchema = Type.Object({
  name: SignatureName,
  data: SignatureDataSchema,
  isDefault: Type.Optional(Type.Boolean()),
});

/** Every field is optional: a rename, a new default or new data each send only theirs. */
export const SignatureUpdateBodySchema = Type.Object({
  name: Type.Optional(SignatureName),
  data: Type.Optional(SignatureDataSchema),
  isDefault: Type.Optional(Type.Boolean()),
});

const SignatureIdParams = Type.Object({id: Type.String()});

export const signatureContract = defineContract('Signature', {
  create: {
    method: 'POST',
    url: '/',
    schema: {
      operationId: 'Create',
      summary: 'Save a signature for the current user',
      body: SignatureCreateBodySchema,
      response: {200: SignatureSchema},
    },
  },
  list: {
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get the saved signatures of the current user',
      response: {200: Type.Array(SignatureSchema)},
    },
  },
  get: {
    method: 'GET',
    url: '/:id',
    schema: {
      summary: 'Returns a saved signature of the current user by id',
      params: SignatureIdParams,
      response: {200: SignatureSchema},
    },
  },
  update: {
    method: 'PUT',
    url: '/:id',
    schema: {
      summary:
        'Rename a saved signature, change its data or make it the default',
      params: SignatureIdParams,
      body: SignatureUpdateBodySchema,
      response: {200: SignatureSchema},
    },
  },
  remove: {
    method: 'DELETE',
    url: '/:id',
    schema: {
      summary: 'Delete a saved signature',
      params: SignatureIdParams,
      response: {200: SignatureSchema},
    },
  },
});

export type SignatureData = Static<typeof SignatureDataSchema>;
export type SignatureResponse = Static<typeof SignatureSchema>;
export type SignatureCreateBody = Static<typeof SignatureCreateBodySchema>;
export type SignatureUpdateBody = Static<typeof SignatureUpdateBodySchema>;
