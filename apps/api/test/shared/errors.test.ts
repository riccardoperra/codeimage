import Fastify from 'fastify';
import {expect, test} from 'vitest';
import {options} from '../../src/app.js';
import errors, {classify, statusByKind} from '../../src/plugins/errors.js';
import requestId from '../../src/plugins/request-id.js';
import {defineErrors} from '../../src/shared/errors.js';

const catalog = defineErrors({
  invalid: {
    code: 'TEST_INVALID',
    kind: 'invalid',
    message: (p: {field: string}) => `Invalid ${p.field}`,
  },
});

test('catalog factories preserve codes, parameters and identity', () => {
  const error = catalog.invalid({field: 'name'});
  expect(error.message).toBe('Invalid name');
  expect(catalog.invalid.is(error)).toBe(true);
  expect(catalog.invalid.is(new Error())).toBe(false);
  expect(() =>
    defineErrors({
      duplicate: {
        code: catalog.invalid.code,
        kind: 'internal',
        message: () => 'duplicate',
      },
    }),
  ).toThrow('defined twice');
  expect(classify(error)).toMatchObject({
    statusCode: statusByKind.invalid,
    code: 'TEST_INVALID',
  });
});

test('errors mask internals and classify persistence and HTTP failures', () => {
  expect(classify(new Error('database password'))).toMatchObject({
    statusCode: 500,
    message: 'Internal Server Error',
  });
  expect(classify({code: 'P2025'})).toMatchObject({statusCode: 404});
  expect(classify({code: 'P2002'})).toMatchObject({statusCode: 409});
  expect(
    classify(Object.assign(new Error('Too large'), {statusCode: 413})),
  ).toMatchObject({statusCode: 413, message: 'Too large'});
});

test('responses and errors echo safe request ids and replace unsafe ids', async t => {
  const app = Fastify({...options, logger: false});
  t.onTestFinished(() => app.close());
  await app.register(errors);
  await app.register(requestId);
  app.get('/fail', async () => {
    throw catalog.invalid({field: 'name'});
  });
  app.post(
    '/validate',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {name: {type: 'string'}},
        },
      },
    },
    async () => ({}),
  );
  const response = await app.inject({
    url: '/fail',
    headers: {'request-id': 'client.123'},
  });
  expect(response.headers['request-id']).toBe('client.123');
  expect(response.json()).toMatchObject({
    statusCode: 400,
    code: 'TEST_INVALID',
    requestId: 'client.123',
  });
  const unsafe = await app.inject({
    url: '/missing',
    headers: {'request-id': 'unsafe id'},
  });
  expect(unsafe.headers['request-id']).toMatch(/^[\da-f-]{36}$/);
  expect(unsafe.json().requestId).toBe(unsafe.headers['request-id']);
  const invalid = await app.inject({
    method: 'POST',
    url: '/validate',
    payload: {},
  });
  expect(invalid.json()).toMatchObject({
    statusCode: 400,
    code: 'FST_ERR_VALIDATION',
    details: [{path: '', message: "must have required property 'name'"}],
  });
});
