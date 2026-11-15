import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {updateProject} from '../commands/update-project.js';
import {actorOf} from '../../../shared/http.js';
import {projectContract as op} from '../project.contract.js';
import {changesFromUpdateBody} from '../project.model.js';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.update,
    handler: request =>
      fastify.commandBus.execute(
        updateProject({
          actor: actorOf(request),
          id: request.params.id,
          changes: changesFromUpdateBody(request.body),
        }),
      ),
  });
};

export default route;
