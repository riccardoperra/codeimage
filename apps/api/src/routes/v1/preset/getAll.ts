import {actorOf} from '../../../shared/http.js';
import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {presetContract as op} from '../../../modules/preset/preset.contract.js';
const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.list,

    handler: request =>
      fastify.presetService.findAllPresets(actorOf(request).userId),
  });
};
export default route;
