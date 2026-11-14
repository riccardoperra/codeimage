import {actorOf} from '../../../shared/http.js';
import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {projectContract as op} from '../../../modules/project/project.contract.js';
const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.updateName,

    handler: request =>
      fastify.projectService.updateName(
        actorOf(request).userId,
        request.params.id,
        request.body.name,
      ),
  });
};
export default route;
