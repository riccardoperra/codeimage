import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {projectContract as op} from '../../../modules/project/project.contract.js';
const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.create,
    preValidation: (req, reply) => fastify.authorize(req, reply),
    handler: request =>
      fastify.projectService.createNewProject(request.appUser.id, request.body),
  });
};
export default route;
