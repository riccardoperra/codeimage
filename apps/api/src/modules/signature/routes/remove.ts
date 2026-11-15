import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {removeSignature} from '../commands/remove-signature.js';
import {actorOf} from '../../../shared/http.js';
import {signatureContract as op} from '../signature.contract.js';
import {toSignatureResponse} from '../signature.http.js';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.remove,
    handler: async request =>
      toSignatureResponse(
        await fastify.commandBus.execute(
          removeSignature({actor: actorOf(request), id: request.params.id}),
        ),
      ),
  });
};

export default route;
