import {actorOf} from '../../../shared/http.js';
import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {projectContract as op} from '../../../modules/project/project.contract.js';
const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.create,

    handler: request =>
      fastify.projectService.createNewProject(
        actorOf(request).userId,
        request.body,
      ),
  });
};
export default route;
