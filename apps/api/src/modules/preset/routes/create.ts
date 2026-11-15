import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {createPreset} from '../commands/create-preset.js';
import {actorOf} from '../../../shared/http.js';
import {presetContract as op} from '../preset.contract.js';
import {toPresetResponse} from '../preset.http.js';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.create,
    handler: async request =>
      toPresetResponse(
        await fastify.commandBus.execute(
          createPreset({actor: actorOf(request), draft: request.body}),
        ),
      ),
  });
};

export default route;
