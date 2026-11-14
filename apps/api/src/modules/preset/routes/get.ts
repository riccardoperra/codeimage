import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {getPreset} from '../queries/get-preset.js';
import {actorOf} from '../../../shared/http.js';
import {presetContract as op} from '../preset.contract.js';
import {toPresetResponse} from '../preset.http.js';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.get,
    handler: async request =>
      toPresetResponse(
        await fastify.queryBus.execute(
          getPreset({actor: actorOf(request), id: request.params.id}),
        ),
      ),
  });
};

export default route;
