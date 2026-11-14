import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Value} from '@sinclair/typebox/value';
import {
  createPreset,
  updatePreset,
  removePreset,
  getPreset,
  listPresets,
} from './index.js';
import {actorOf} from '../../shared/http.js';
import {
  presetContract as op,
  PresetDataSchema,
  type PresetResponse,
} from './preset.contract.js';
import type {Preset} from './preset.model.js';

const presetRoutes: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.create,
    handler: async request =>
      toPresetResponse(
        await fastify.commandBus.execute(
          createPreset({actor: actorOf(request), draft: request.body}),
        ),
      ),
  });

  fastify.route({
    ...op.list,
    handler: async request =>
      (
        await fastify.queryBus.execute(listPresets({actor: actorOf(request)}))
      ).map(toPresetResponse),
  });

  fastify.route({
    ...op.get,
    handler: async request =>
      toPresetResponse(
        await fastify.queryBus.execute(
          getPreset({actor: actorOf(request), id: request.params.id}),
        ),
      ),
  });

  fastify.route({
    ...op.update,
    handler: async request =>
      toPresetResponse(
        await fastify.commandBus.execute(
          updatePreset({
            actor: actorOf(request),
            id: request.params.id,
            changes: request.body,
          }),
        ),
      ),
  });

  fastify.route({
    ...op.remove,
    handler: async request =>
      toPresetResponse(
        await fastify.commandBus.execute(
          removePreset({actor: actorOf(request), id: request.params.id}),
        ),
      ),
  });
};

export default presetRoutes;

function toPresetResponse(preset: Preset): PresetResponse {
  const {data} = preset;
  if (!Value.Check(PresetDataSchema, data)) {
    throw new Error(
      `Preset ${preset.id}: stored data does not match PresetDataSchema`,
    );
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
