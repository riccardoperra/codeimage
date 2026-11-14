import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {presetContract as op} from '../../../modules/preset/preset.contract.js';
const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.update,
    preValidation: (req, reply) => fastify.authorize(req, reply),
    handler: request =>
      fastify.presetService.updatePreset(
        request.appUser.id,
        request.params.id,
        request.body,
      ),
  });
};
export default route;
