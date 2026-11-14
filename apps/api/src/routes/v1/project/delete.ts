import {actorOf} from '../../../shared/http.js';
import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {projectContract as op} from '../../../modules/project/project.contract.js';
const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.remove,

    handler: request =>
      fastify.projectRepository.deleteProject(
        request.params.id,
        actorOf(request).userId,
      ),
  });
};
export default route;
