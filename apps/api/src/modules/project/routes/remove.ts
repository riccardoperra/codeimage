import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {removeProject} from '../commands/remove-project.js';
import {actorOf} from '../../../shared/http.js';
import {projectContract as op} from '../project.contract.js';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.remove,
    handler: request =>
      fastify.commandBus.execute(
        removeProject({actor: actorOf(request), id: request.params.id}),
      ),
  });
};

export default route;
