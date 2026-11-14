import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {listPresets} from '../queries/list-presets.js';
import {actorOf} from '../../../shared/http.js';
import {presetContract as op} from '../preset.contract.js';
import {toPresetResponse} from '../preset.http.js';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.list,
    handler: async request =>
      (
        await fastify.queryBus.execute(listPresets({actor: actorOf(request)}))
      ).map(toPresetResponse),
  });
};

export default route;
