import type {User} from '@codeimage/prisma-models';
import {afterEach, assert, beforeEach, expect, test} from 'vitest';
import type {
  SignatureCreateBody,
  SignatureResponse,
} from '../../../../src/modules/signature/signature.contract.js';
import {build} from '../../../helpers/app.js';
import {signatureData} from '../../../helpers/fakes.js';
import {clearAllSeeds, client, userSeed} from '../../../helpers/seed.js';

interface TestContext {
  user: User;
}

beforeEach<TestContext>(async context => {
  context.user = await userSeed.createUser();
});

afterEach(async () => {
  await client.signature.deleteMany();
  await clearAllSeeds();
});

const create = (
  fastify: Awaited<ReturnType<typeof build>>,
  body: SignatureCreateBody,
) => fastify.inject({url: '/api/v1/signature', method: 'POST', payload: body});

test<TestContext>('POST /v1/signature saves up to the limit, then 422', async t => {
  const fastify = await build(t, {config: {SIGNATURES_LIMIT: 3}});
  for (const name of ['Work', 'Personal', 'Talks']) {
    const response = await create(fastify, {name, data: signatureData()});
    assert.strictEqual(response.statusCode, 200);
  }
  const fourth = await create(fastify, {name: 'Four', data: signatureData()});
  assert.strictEqual(fourth.statusCode, 422);
  expect(await client.signature.count({where: {ownerId: t.user.id}})).toBe(3);
});

test<TestContext>('PUT /v1/signature/:id keeps one default and renames', async t => {
  const fastify = await build(t);
  const first = (
    await create(fastify, {
      name: 'Work',
      data: signatureData(),
      isDefault: true,
    })
  ).json<SignatureResponse>();
  const second = (
    await create(fastify, {name: 'Personal', data: signatureData()})
  ).json<SignatureResponse>();

  const response = await fastify.inject({
    url: `/api/v1/signature/${second.id}`,
    method: 'PUT',
    payload: {isDefault: true, name: 'Home'},
  });
  assert.strictEqual(response.statusCode, 200);
  expect(response.json<SignatureResponse>()).toMatchObject({
    name: 'Home',
    isDefault: true,
    version: 2,
  });

  const list = await fastify.inject({url: '/api/v1/signature', method: 'GET'});
  const byId = Object.fromEntries(
    list.json<SignatureResponse[]>().map(row => [row.id, row.isDefault]),
  );
  expect(byId).toEqual({[first.id]: false, [second.id]: true});
});

test<TestContext>('DELETE /v1/signature/:id removes it, and 404 after', async t => {
  const fastify = await build(t);
  const saved = (
    await create(fastify, {name: 'Work', data: signatureData()})
  ).json<SignatureResponse>();
  const url = `/api/v1/signature/${saved.id}`;
  assert.strictEqual(
    (await fastify.inject({url, method: 'DELETE'})).statusCode,
    200,
  );
  assert.strictEqual(
    (await fastify.inject({url, method: 'GET'})).statusCode,
    404,
  );
});
