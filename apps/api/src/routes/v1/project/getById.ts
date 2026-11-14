import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {projectContract as op} from '../../../modules/project/project.contract.js';
const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.get,
    handler: request =>
      fastify.projectService.findById(
        request.principal.kind === 'user'
          ? {id: request.principal.userId}
          : null,
        request.params.id,
      ),
  });
};
export default route;
