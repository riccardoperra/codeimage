import {Value} from '@sinclair/typebox/value';
import {expect, test} from 'vitest';
import createHandler from '../../../src/modules/signature/commands/create-signature.js';
import updateHandler from '../../../src/modules/signature/commands/update-signature.js';
import removeHandler from '../../../src/modules/signature/commands/remove-signature.js';
import getHandler from '../../../src/modules/signature/queries/get-signature.js';
import listHandler from '../../../src/modules/signature/queries/list-signatures.js';
import {
  SignatureCreateBodySchema,
  SignatureUpdateBodySchema,
} from '../../../src/modules/signature/signature.contract.js';
import {
  inMemorySignatures,
  scopeFor,
  signatureData,
  testActor,
} from '../../helpers/fakes.js';

const alice = testActor();
const bob = testActor('bob');

test('the limit allows exactly `limit` signatures per account', async () => {
  const signatures = inMemorySignatures();
  const create = createHandler.factory({scopeFor, signatures, limit: 3});
  for (const name of ['a', 'b', 'c'])
    await create({actor: alice, draft: {name, data: signatureData()}});
  await expect(
    create({actor: alice, draft: {name: 'd', data: signatureData()}}),
  ).rejects.toMatchObject({
    code: 'ExceedSignatureLimitException',
    message: 'Signature limit per account exceeded',
  });
  expect(signatures.all()).toHaveLength(3);
  await expect(
    create({actor: bob, draft: {name: 'bob', data: signatureData()}}),
  ).resolves.toMatchObject({ownerId: bob.userId});
});

test('zero disables the limit', async () => {
  const signatures = inMemorySignatures();
  const create = createHandler.factory({scopeFor, signatures, limit: 0});
  for (const name of ['a', 'b', 'c', 'd'])
    await create({actor: alice, draft: {name, data: signatureData()}});
  expect(signatures.all()).toHaveLength(4);
});

test('one default per account, set on create or on update', async () => {
  const signatures = inMemorySignatures();
  const create = createHandler.factory({scopeFor, signatures, limit: 3});
  const update = updateHandler.factory({scopeFor, signatures});
  const first = await create({
    actor: alice,
    draft: {name: 'work', data: signatureData(), isDefault: true},
  });
  const second = await create({
    actor: alice,
    draft: {name: 'personal', data: signatureData(), isDefault: true},
  });
  const theirs = await create({
    actor: bob,
    draft: {name: 'bob', data: signatureData(), isDefault: true},
  });
  const defaults = () =>
    signatures
      .all()
      .filter(row => row.isDefault)
      .map(row => row.id);
  expect(defaults()).toEqual([second.id, theirs.id]);
  await update({actor: alice, id: first.id, changes: {isDefault: true}});
  expect(defaults()).toEqual([first.id, theirs.id]);
  const renamed = await update({
    actor: alice,
    id: first.id,
    changes: {name: 'job'},
  });
  expect(renamed).toMatchObject({name: 'job', isDefault: true, version: 3});
});

test('get, list, update and remove stay within the actor scope', async () => {
  const signatures = inMemorySignatures();
  const create = createHandler.factory({scopeFor, signatures, limit: 3});
  const row = await create({
    actor: alice,
    draft: {name: 'mine', data: signatureData()},
  });
  const get = getHandler.factory({scopeFor, signatures});
  const update = updateHandler.factory({scopeFor, signatures});
  const remove = removeHandler.factory({scopeFor, signatures});
  expect(
    await listHandler.factory({scopeFor, signatures})({actor: bob}),
  ).toEqual([]);
  for (const call of [
    () => get({actor: bob, id: row.id}),
    () => update({actor: bob, id: row.id, changes: {name: 'stolen'}}),
    () => remove({actor: bob, id: row.id}),
  ]) {
    await expect(call()).rejects.toMatchObject({
      code: 'NotFoundSignatureException',
    });
  }
  expect(await get({actor: alice, id: row.id})).toEqual(row);
  expect(await remove({actor: alice, id: row.id})).toMatchObject({id: row.id});
  expect(signatures.all()).toEqual([]);
});

test('the bodies take the snippet signature fields and reject unknown values', () => {
  expect(
    Value.Check(SignatureCreateBodySchema, {
      name: 'Work',
      data: signatureData(),
    }),
  ).toBe(true);
  expect(
    Value.Check(SignatureCreateBodySchema, {
      name: '',
      data: signatureData(),
    }),
  ).toBe(false);
  expect(
    Value.Check(SignatureCreateBodySchema, {
      name: 'Work',
      data: {...signatureData(), style: 'neon'},
    }),
  ).toBe(false);
  expect(Value.Check(SignatureUpdateBodySchema, {isDefault: true})).toBe(true);
});
