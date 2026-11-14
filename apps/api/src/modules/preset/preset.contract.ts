import type {Static} from '@sinclair/typebox';
import {Type} from '@sinclair/typebox';
import {defineContract} from '../../shared/contract.js';
import {
  BaseSnippetEditorOptionsSchema,
  BaseSnippetFrameSchema,
  BaseSnippetTerminalSchema,
} from '../project/project.contract.js';

export const PresetDataSchema = Type.Object({
  appVersion: Type.String(),
  terminal: Type.Omit(BaseSnippetTerminalSchema, ['id']),
  frame: Type.Omit(BaseSnippetFrameSchema, ['id']),
  editor: Type.Omit(BaseSnippetEditorOptionsSchema, ['id']),
  localSyncId: Type.Optional(Type.String()),
});

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

export type PresetDto = PresetResponse;
export type PresetCreateDto = PresetCreateBody;
export type PresetUpdateDto = PresetUpdateBody;

export type PresetDataDto = PresetData;
