import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {projectContract as op} from '../../../modules/project/project.contract.js';
const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.update,
    preValidation: (req, reply) => fastify.authorize(req, reply),
    handler: request =>
      fastify.projectService.update(
        request.appUser.id,
        request.params.id,
        request.body,
      ),
  });
};
export default route;
