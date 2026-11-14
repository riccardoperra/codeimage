import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {projectContract as op} from '../../../modules/project/project.contract.js';
const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.clone,
    preValidation: (req, reply) => fastify.authorize(req, reply),
    handler: request =>
      fastify.projectService.clone(
        request.appUser,
        request.params.id,
        request.body.newName ?? null,
      ),
  });
};
export default route;
