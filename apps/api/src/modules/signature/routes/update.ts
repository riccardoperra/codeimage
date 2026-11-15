import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {updateSignature} from '../commands/update-signature.js';
import {actorOf} from '../../../shared/http.js';
import {signatureContract as op} from '../signature.contract.js';
import {toSignatureResponse} from '../signature.http.js';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.update,
    handler: async request =>
      toSignatureResponse(
        await fastify.commandBus.execute(
          updateSignature({
            actor: actorOf(request),
            id: request.params.id,
            changes: request.body,
          }),
        ),
      ),
  });
};

export default route;
