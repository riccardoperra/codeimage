import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {projectContract as op} from '../../../modules/project/project.contract.js';
const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.list,
    preValidation: (req, reply) => fastify.authorize(req, reply),
    handler: request =>
      fastify.projectService.findAllByUserId(request.appUser.id),
  });
};
export default route;
