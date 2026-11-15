import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {updatePreset} from '../commands/update-preset.js';
import {actorOf} from '../../../shared/http.js';
import {presetContract as op} from '../preset.contract.js';
import {toPresetResponse} from '../preset.http.js';

const route: FastifyPluginAsyncTypebox = async fastify => {
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
};

export default route;
