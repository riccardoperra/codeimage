/**
 * Routes for /api/v1/preset. The template for every route in the codebase:
 *   fastify.route({...op.<operation>, handler: request => service.<operation>(actorOf(request), ...)})
 * http/app-api.ts registers this plugin under its prefix and auth hook.
 */
import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Value} from '@sinclair/typebox/value';
import {actorOf} from '../../shared/http.js';
import {
  presetContract as op,
  PresetDataSchema,
  type PresetResponse,
} from './preset.contract.js';
import type {Preset} from './preset.model.js';

const presetRoutes: FastifyPluginAsyncTypebox = async fastify => {
  const presets = fastify.preset;

  fastify.route({
    ...op.create,
    // request.body: Static<PresetCreateBodySchema>, validated by Ajv before this runs.
    // Return type checked against Static<PresetSchema>; serialization drops ownerId.
    handler: async request =>
      toPresetResponse(await presets.create(actorOf(request), request.body)),
  });

  fastify.route({
    ...op.list,
    handler: async request =>
      (await presets.list(actorOf(request))).map(toPresetResponse),
  });

  fastify.route({
    ...op.get,
    handler: async request =>
      toPresetResponse(await presets.get(actorOf(request), request.params.id)),
  });

  fastify.route({
    ...op.update,
    handler: async request =>
      toPresetResponse(
        await presets.update(actorOf(request), request.params.id, request.body),
      ),
  });

  fastify.route({
    ...op.remove,
    handler: async request =>
      toPresetResponse(await presets.remove(actorOf(request), request.params.id)),
  });
};

export default presetRoutes;

/**
 * Domain to wire. The wire promises PresetData (apps/codeimage reads its fields), the domain holds any
 * JSON object (update does not validate `data`, Q3). A stored object that is not PresetData already
 * fails today, when the response serializer finds a required field missing: a 500. This check makes
 * that failure explicit and lets the compiler see the narrowing.
 */
function toPresetResponse(preset: Preset): PresetResponse {
  const {data} = preset;
  if (!Value.Check(PresetDataSchema, data)) {
    throw new Error(`Preset ${preset.id}: stored data does not match PresetDataSchema`);
  }
  return {
    id: preset.id,
    name: preset.name,
    createdAt: preset.createdAt,
    updatedAt: preset.updatedAt,
    version: preset.version,
    data,
  };
}
