import {fastifySensible} from '@fastify/sensible';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import t from 'tap';
import {HandlerError} from '../../src/common/exceptions/handlerError';
import handlerErrors from '../../src/plugins/handlerErrors';

async function build(t: Tap.Test, response: () => unknown) {
  const app = Fastify();
  await void app.register(
    fp(async app => {
      await app.register(fastifySensible);
      await app.register(handlerErrors);
    }),
  );
  app.get('/', async _ => response());
  await app.ready();
  t.teardown(() => void app.close());
  return app;
}

t.test('should throw exception by status code', async t => {
  class DomainNotValid extends HandlerError {
    statusCode = HandlerError.httpStatusCode.HTTP_STATUS_BAD_REQUEST;

    createMessage(): string {
      return 'Domain not valid';
    }
  }

  const app = await build(t, () => {
    throw new DomainNotValid();
  });

  const response = await app.inject({
    method: 'GET',
    path: '/',
  });

  const json = response.json<{code: string; message: string}>();

  t.equal(response.statusCode, 400);
  t.equal(json.code, 'DomainNotValid');
  t.equal(json.message, 'Domain not valid');
});
