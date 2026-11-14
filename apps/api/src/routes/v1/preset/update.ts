import {actorOf} from '../../../shared/http.js';
import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {presetContract as op} from '../../../modules/preset/preset.contract.js';
const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.update,

    handler: request =>
      fastify.presetService.updatePreset(
        actorOf(request).userId,
        request.params.id,
        request.body,
      ),
  });
};
export default route;
