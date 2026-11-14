import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {cloneProject} from '../commands/clone-project.js';
import {actorOf} from '../../../shared/http.js';
import {projectContract as op} from '../project.contract.js';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.clone,
    handler: request =>
      fastify.commandBus.execute(
        cloneProject({
          actor: actorOf(request),
          sourceId: request.params.id,
          newName: request.body.newName ?? null,
        }),
      ),
  });
};

export default route;
