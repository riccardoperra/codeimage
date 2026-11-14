import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {removePreset} from '../commands/remove-preset.js';
import {actorOf} from '../../../shared/http.js';
import {presetContract as op} from '../preset.contract.js';
import {toPresetResponse} from '../preset.http.js';

const route: FastifyPluginAsyncTypebox = async fastify => {
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

export default route;
