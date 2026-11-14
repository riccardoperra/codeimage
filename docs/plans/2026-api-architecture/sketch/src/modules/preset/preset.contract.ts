/**
 * Preset HTTP contract (/api/v1/preset). api-types.ts derives PresetApi from it.
 * Schemas moved verbatim from modules/preset/schema/*.ts; operations from routes/v1/preset/*.ts.
 */
import type {Static} from '@sinclair/typebox';
import {Type} from '@sinclair/typebox';
import {defineContract} from '../../shared/contract.js';
import {
  BaseSnippetEditorOptionsSchema,
  BaseSnippetFrameSchema,
  BaseSnippetTerminalSchema,
} from '../project/project.contract.js';

/** The editor style snapshot a preset stores. Opaque JSON to the database, typed on the wire. */
export const PresetDataSchema = Type.Object({
  appVersion: Type.String(),
  terminal: Type.Omit(BaseSnippetTerminalSchema, ['id']),
  frame: Type.Omit(BaseSnippetFrameSchema, ['id']),
  editor: Type.Omit(BaseSnippetEditorOptionsSchema, ['id']),
  localSyncId: Type.Optional(Type.String()),
});

/** Response whitelist. `ownerId` is not in it, so the serializer never emits it. */
export const PresetSchema = Type.Object(
  {
    id: Type.String({format: 'uuid'}),
    name: Type.String(),
    createdAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    updatedAt: Type.Unsafe<Date | string>({format: 'date-time'}),
    version: Type.Number(),
    data: PresetDataSchema,
  },
  {title: 'PresetResponse'},
);

export const PresetCreateBodySchema = Type.Object({
  name: Type.String(),
  data: PresetDataSchema,
});

/**
 * Kept as today: update accepts any object as `data` (create validates the full PresetDataSchema).
 * Tightening it is open question Q3: it would turn today's "update unknown id gets 404" test into a 400.
 */
export const PresetUpdateBodySchema = Type.Object({
  name: Type.String(),
  data: Type.Object({}),
});

const PresetIdParams = Type.Object({id: Type.String()});

export const presetContract = defineContract('Preset', {
  create: {
    method: 'POST',
    url: '/',
    schema: {
      operationId: 'Create',
      summary: 'Create a new CodeImage Preset',
      body: PresetCreateBodySchema,
      response: {200: PresetSchema},
    },
  },
  list: {
    method: 'GET',
    url: '/',
    schema: {
      summary: 'Get all CodeImage presets filtered by current user',
      response: {200: Type.Array(PresetSchema)},
    },
  },
  get: {
    method: 'GET',
    url: '/:id',
    schema: {
      summary: 'Returns current user preset by id',
      params: PresetIdParams,
      response: {200: PresetSchema},
    },
  },
  update: {
    method: 'PUT',
    url: '/:id',
    schema: {
      summary: 'Update a existing CodeImage preset by id',
      params: PresetIdParams,
      body: PresetUpdateBodySchema,
      response: {200: PresetSchema},
    },
  },
  remove: {
    method: 'DELETE',
    url: '/:id',
    schema: {
      summary: 'Delete an existing CodeImage preset',
      params: PresetIdParams,
      response: {200: PresetSchema},
    },
  },
});

export type PresetData = Static<typeof PresetDataSchema>;
export type PresetResponse = Static<typeof PresetSchema>;
export type PresetCreateBody = Static<typeof PresetCreateBodySchema>;
export type PresetUpdateBody = Static<typeof PresetUpdateBodySchema>;
