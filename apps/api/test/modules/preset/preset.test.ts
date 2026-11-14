import {expect, test} from 'vitest';
import createHandler from '../../../src/modules/preset/commands/create-preset.js';
import updateHandler from '../../../src/modules/preset/commands/update-preset.js';
import removeHandler from '../../../src/modules/preset/commands/remove-preset.js';
import getHandler from '../../../src/modules/preset/queries/get-preset.js';
import listHandler from '../../../src/modules/preset/queries/list-presets.js';
import {inMemoryPresets, presetData, testActor} from '../../helpers/fakes.js';

const alice = testActor();
const bob = testActor('bob');

test('create stores under the actor with version 1', async () => {
  const presets = inMemoryPresets();
  const create = createHandler.factory({presets, limit: 10});
  const row = await create({
    actor: alice,
    draft: {name: 'Dracula', data: presetData()},
  });
  expect(row).toMatchObject({
    ownerId: alice.userId,
    version: 1,
    name: 'Dracula',
  });
  expect(presets.all()).toEqual([row]);
});

test('the strict limit allows limit + 1 and rejects the next create', async () => {
  const presets = inMemoryPresets();
  const create = createHandler.factory({presets, limit: 1});
  for (const name of ['a', 'b'])
    await create({actor: alice, draft: {name, data: presetData()}});
  await expect(
    create({actor: alice, draft: {name: 'c', data: presetData()}}),
  ).rejects.toMatchObject({
    code: 'ExceedPresetLimitException',
    message: 'Preset limit per account exceeded',
  });
  expect(presets.all()).toHaveLength(2);
  await expect(
    create({actor: bob, draft: {name: 'bob', data: presetData()}}),
  ).resolves.toMatchObject({ownerId: bob.userId});
});

test('zero disables the limit', async () => {
  const presets = inMemoryPresets();
  const create = createHandler.factory({presets, limit: 0});
  for (const name of ['a', 'b', 'c'])
    await create({actor: alice, draft: {name, data: presetData()}});
  expect(presets.all()).toHaveLength(3);
});

test('get, list, update and remove stay within the actor scope', async () => {
  const presets = inMemoryPresets();
  const create = createHandler.factory({presets, limit: 10});
  const row = await create({
    actor: alice,
    draft: {name: 'mine', data: presetData()},
  });
  const get = getHandler.factory({presets});
  const update = updateHandler.factory({presets});
  const remove = removeHandler.factory({presets});
  expect(await listHandler.factory({presets})({actor: bob})).toEqual([]);
  for (const call of [
    () => get({actor: bob, id: row.id}),
    () => update({actor: bob, id: row.id, changes: {name: 'stolen', data: {}}}),
    () => remove({actor: bob, id: row.id}),
  ]) {
    await expect(call()).rejects.toMatchObject({
      code: 'NotFoundPresetException',
    });
    expect(presets.all()).toEqual([row]);
  }
  expect(await get({actor: alice, id: row.id})).toEqual(row);
  expect(
    await update({
      actor: alice,
      id: row.id,
      changes: {name: 'updated', data: {}},
    }),
  ).toMatchObject({name: 'updated'});
  expect(await remove({actor: alice, id: row.id})).toMatchObject({id: row.id});
  expect(presets.all()).toEqual([]);
});
