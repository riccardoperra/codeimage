import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {createProject} from '../commands/create-project.js';
import {actorOf} from '../../../shared/http.js';
import {projectContract as op} from '../project.contract.js';
import {draftFromCreateBody} from '../project.model.js';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.create,
    handler: request =>
      fastify.commandBus.execute(
        createProject({
          actor: actorOf(request),
          draft: draftFromCreateBody(request.body),
        }),
      ),
  });
};

export default route;
