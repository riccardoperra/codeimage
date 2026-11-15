import type {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {listSignatures} from '../queries/list-signatures.js';
import {actorOf} from '../../../shared/http.js';
import {signatureContract as op} from '../signature.contract.js';
import {toSignatureResponse} from '../signature.http.js';

const route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.route({
    ...op.list,
    handler: async request =>
      (
        await fastify.queryBus.execute(
          listSignatures({actor: actorOf(request)}),
        )
      ).map(toSignatureResponse),
  });
};

export default route;
