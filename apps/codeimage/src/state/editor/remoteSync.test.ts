import assert from 'node:assert/strict';
import {afterEach, beforeEach, test, vi} from 'vitest';
import {createRemoteSaves} from './remoteSync';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function fixture({readOnly = false, loggedIn = true} = {}) {
  let id = 'project-1';
  const saved: [string, string][] = [];
  const pending: boolean[] = [];
  const writes = createRemoteSaves<string>(
    {id: () => id, loggedIn: () => loggedIn, readOnly: () => readOnly},
    async (id, state) => {
      saved.push([id, state]);
    },
    value => pending.push(value),
  );
  return {writes, saved, pending, navigate: (next: string) => (id = next)};
}

test('a burst of changes saves the latest edit after the idle delay', async () => {
  const {writes, saved, pending} = fixture();
  writes.schedule('first');
  await vi.advanceTimersByTimeAsync(100);
  writes.schedule('latest');
  await vi.advanceTimersByTimeAsync(150);
  assert.deepEqual(pending, [true]);
  await vi.advanceTimersByTimeAsync(2999);
  assert.deepEqual(saved, []);
  await vi.advanceTimersByTimeAsync(1);
  assert.deepEqual(saved, [['project-1', 'latest']]);
  assert.deepEqual(pending, [true, false]);
});

test('read-only and signed-out changes are never sent', async () => {
  const fixtures = [fixture({readOnly: true}), fixture({loggedIn: false})];
  for (const {writes} of fixtures) writes.schedule('edited');
  await vi.advanceTimersByTimeAsync(5000);
  for (const {saved, pending} of fixtures) {
    assert.deepEqual(saved, []);
    assert.deepEqual(pending, []);
  }
});

test('a queued edit is saved to its original project after navigation', async () => {
  const {writes, saved, navigate, pending} = fixture();
  writes.schedule('edited');
  navigate('project-2');
  await vi.advanceTimersByTimeAsync(5000);
  assert.deepEqual(saved, [['project-1', 'edited']]);
  assert.deepEqual(pending, []);
});

test('an in-flight save blocks later writes for that project only', async () => {
  let id = 'project-1';
  const saved: [string, string][] = [];
  const first = Promise.withResolvers<void>();
  const writes = createRemoteSaves<string>(
    {id: () => id, loggedIn: () => true, readOnly: () => false},
    async (id, state) => {
      saved.push([id, state]);
      if (state === 'first') await first.promise;
    },
    () => {},
  );
  writes.schedule('first');
  await vi.advanceTimersByTimeAsync(3150);
  writes.schedule('second');
  id = 'project-2';
  writes.schedule('other');
  await vi.advanceTimersByTimeAsync(3150);
  assert.deepEqual(saved, [
    ['project-1', 'first'],
    ['project-2', 'other'],
  ]);
  first.resolve();
  await vi.advanceTimersByTimeAsync(0);
  assert.deepEqual(saved.at(-1), ['project-1', 'second']);
});

test('disposal cancels pending timers', async () => {
  const {writes, saved, pending} = fixture();
  writes.schedule('edited');
  writes.dispose();
  await vi.advanceTimersByTimeAsync(5000);
  assert.deepEqual(saved, []);
  assert.deepEqual(pending, []);
});
