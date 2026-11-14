import {actorOf} from '../../../shared/http.js';
import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {projectContract as op} from '../../../modules/project/project.contract.js';
const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.clone,

    handler: request =>
      fastify.projectService.clone(
        {id: actorOf(request).userId},
        request.params.id,
        request.body.newName ?? null,
      ),
  });
};
export default route;
