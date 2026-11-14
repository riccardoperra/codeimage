import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {projectContract as op} from '../../../modules/project/project.contract.js';
const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.remove,
    preValidation: (req, reply) => fastify.authorize(req, reply),
    handler: request =>
      fastify.projectRepository.deleteProject(
        request.params.id,
        request.appUser.id,
      ),
  });
};
export default route;
