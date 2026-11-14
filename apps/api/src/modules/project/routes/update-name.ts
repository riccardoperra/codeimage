import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {renameProject} from '../commands/rename-project.js';
import {actorOf} from '../../../shared/http.js';
import {projectContract as op} from '../project.contract.js';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.updateName,
    handler: request =>
      fastify.commandBus.execute(
        renameProject({
          actor: actorOf(request),
          id: request.params.id,
          name: request.body.name,
        }),
      ),
  });
};

export default route;
