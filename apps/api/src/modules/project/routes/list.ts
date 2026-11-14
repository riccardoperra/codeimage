import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {listProjects} from '../queries/list-projects.js';
import {actorOf} from '../../../shared/http.js';
import {projectContract as op} from '../project.contract.js';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.list,
    handler: request =>
      fastify.queryBus.execute(listProjects({actor: actorOf(request)})),
  });
};

export default route;
