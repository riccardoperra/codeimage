import type * as Solid from 'solid-js';
import {createRoot, createSignal, flush} from 'solid-js';
import {expect, test, vi} from 'vitest';
import {createResource} from './create-resource';

vi.mock('solid-js', () =>
  vi.importActual<typeof Solid>(
    new URL('./dist/solid.js', import.meta.resolve('solid-js/package.json'))
      .pathname,
  ),
);

test('a resource keeps the latest result when an earlier request finishes late', async () => {
  const requests = new Map<string, (value: string) => void>();
  const fixture = createRoot(dispose => {
    const [key, setKey] = createSignal('first');
    const [resource, {mutate}] = createResource(
      key,
      key =>
        new Promise<string>(resolve => {
          requests.set(key, resolve);
        }),
    );
    return {dispose, resource, mutate, setKey};
  });
  try {
    expect(fixture.resource.state).toBe('pending');
    fixture.setKey('active');
    flush();
    requests.get('active')?.('current');
    await Promise.resolve();
    flush();
    requests.get('first')?.('stale');
    await Promise.resolve();
    flush();
    expect(fixture.resource.latest).toBe('current');
    expect(fixture.resource.state).toBe('ready');
    fixture.mutate(value => value?.toUpperCase());
    flush();
    expect(fixture.resource.latest).toBe('CURRENT');
  } finally {
    fixture.dispose();
  }
});
