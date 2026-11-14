/**
 * NOT PART OF THE MIGRATION. Public v1 contract for presets, served at /public/v1/presets by
 * later/http/public-api.ts. When it ships it moves to src/modules/preset/.
 *
 * It defines its own response schema and imports nothing from preset.contract.ts. The app contract
 * changes in lockstep with apps/codeimage; this one is a promise to third parties. Sharing a schema
 * would let an app change silently break the public API.
 * Rules for this file: additive changes only within v1 (new optional fields, new operations); a
 * breaking change is a new v2 contract, never an edit here.
 */
import type {Static} from '@sinclair/typebox';
import {Type} from '@sinclair/typebox';
import {defineContract} from '../../../src/shared/contract.js';

export const PublicPresetV1Schema = Type.Object(
  {
    id: Type.String({format: 'uuid'}),
    name: Type.String(),
  },
  {title: 'Preset'},
);

export const presetPublicContract = defineContract('Presets', {
  list: {
    method: 'GET',
    url: '/',
    schema: {
      summary: "List the presets of the API key's owner",
      // An envelope from day one, so cursor pagination (`nextCursor`) is an additive change later.
      response: {200: Type.Object({items: Type.Array(PublicPresetV1Schema)})},
    },
  },
});

export type PublicPresetV1 = Static<typeof PublicPresetV1Schema>;
