import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {createSignature} from '../commands/create-signature.js';
import {actorOf} from '../../../shared/http.js';
import {signatureContract as op} from '../signature.contract.js';
import {toSignatureResponse} from '../signature.http.js';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.create,
    handler: async request =>
      toSignatureResponse(
        await fastify.commandBus.execute(
          createSignature({actor: actorOf(request), draft: request.body}),
        ),
      ),
  });
};

export default route;
