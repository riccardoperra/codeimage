/**
 * NOT PART OF THE MIGRATION. Routes for /public/v1/presets.
 *
 * Same service as the app routes (`fastify.preset`), different edge: later/http/public-api.ts already
 * resolved the API key to an Actor. The response is mapped field by field to the versioned public
 * shape, never returned as the domain type, so a new domain field cannot leak into a promised contract.
 */
import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import type {Preset} from '../../../src/modules/preset/index.js';
import {actorOf} from '../../../src/shared/http.js';
import {presetPublicContract as op, type PublicPresetV1} from './preset.public.contract.js';

const presetPublicRoutes: FastifyPluginAsyncTypebox = async fastify => {
  const presets = fastify.preset;

  fastify.route({
    ...op.list,
    handler: async request => ({
      items: (await presets.list(actorOf(request))).map(toPublicPresetV1),
    }),
  });
};

export default presetPublicRoutes;

function toPublicPresetV1(preset: Preset): PublicPresetV1 {
  return {id: preset.id, name: preset.name};
}
