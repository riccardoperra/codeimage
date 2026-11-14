import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {getProject} from '../queries/get-project.js';
import {projectContract as op} from '../project.contract.js';
import {toProjectResponse} from '../project.http.js';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.get,
    handler: async request =>
      toProjectResponse(
        await fastify.queryBus.execute(
          getProject({viewer: request.principal, id: request.params.id}),
        ),
      ),
  });
};

export default route;
