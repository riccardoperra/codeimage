import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {projectContract as op} from '../../../modules/project/project.contract.js';
const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.get,
    preValidation: (req, reply) =>
      fastify.authorize(req, reply, {mustBeAuthenticated: false}),
    handler: request =>
      fastify.projectService.findById(request.appUser, request.params.id),
  });
};
export default route;
