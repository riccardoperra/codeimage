import {actorOf} from '../../../shared/http.js';
import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {presetContract as op} from '../../../modules/preset/preset.contract.js';
const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.get,

    handler: request =>
      fastify.presetService.findPresetById(
        actorOf(request).userId,
        request.params.id,
      ),
  });
};
export default route;
