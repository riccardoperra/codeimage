import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {getSignature} from '../queries/get-signature.js';
import {actorOf} from '../../../shared/http.js';
import {signatureContract as op} from '../signature.contract.js';
import {toSignatureResponse} from '../signature.http.js';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.get,
    handler: async request =>
      toSignatureResponse(
        await fastify.queryBus.execute(
          getSignature({actor: actorOf(request), id: request.params.id}),
        ),
      ),
  });
};

export default route;
