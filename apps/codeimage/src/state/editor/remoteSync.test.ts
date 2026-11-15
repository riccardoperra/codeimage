import assert from 'node:assert/strict';
import {Subject} from 'rxjs';
import {afterEach, beforeEach, test, vi} from 'vitest';
import {remoteSaves} from './remoteSync';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function editSettings(project: {readOnly: boolean}) {
  const changes = new Subject<{transitionMs: number}>();
  const saved: [string, {transitionMs: number}][] = [];
  const subscription = remoteSaves(
    changes,
    {
      id: () => 'project-1',
      loggedIn: () => true,
      readOnly: () => project.readOnly,
    },
    async (id, state) => {
      saved.push([id, state]);
    },
    () => {},
  ).subscribe();
  changes.next({transitionMs: 500});
  vi.advanceTimersByTime(5000);
  subscription.unsubscribe();
  return saved;
}

test('a change to a project the user owns is saved to it', () => {
  assert.deepEqual(editSettings({readOnly: false}), [
    ['project-1', {transitionMs: 500}],
  ]);
});

test('a change to a project the user does not own is never sent', () => {
  assert.deepEqual(editSettings({readOnly: true}), []);
});
