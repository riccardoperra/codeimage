import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {presetContract as op} from '../../../modules/preset/preset.contract.js';
const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.remove,
    preValidation: (req, reply) => fastify.authorize(req, reply),
    handler: request =>
      fastify.presetService.deletePreset(request.appUser.id, request.params.id),
  });
};
export default route;
