import {
  createEffect,
  createRoot,
  createStore as createSolidStore,
  flush,
} from 'solid-js';
import {expect, test, vi} from 'vitest';
import {createStore} from './createStore';
import {createPathSetter} from './createPathSetter';
import {getStoreInternals} from './getStoreInternals';

vi.mock('solid-js', () =>
  vi.importActual(
    new URL('./dist/solid.js', import.meta.resolve('solid-js/package.json'))
      .pathname,
  ),
);

test('publishes one committed snapshot for related writes and stops on disposal', () => {
  const fixture = createRoot(dispose => {
    const [store, setStore, {snapshot}] = createStore({
      tabs: ['first', 'second'],
      active: 'first',
    });
    return {dispose, store, setStore, snapshot};
  });
  const seen: {tabs: string[]; active: string}[] = [];
  const stop = createRoot(dispose => {
    createEffect(fixture.snapshot, ({tabs, active}) => {
      seen.push({tabs: [...tabs], active});
    });
    return dispose;
  });
  try {
    flush();
    const {store, setStore} = fixture;
    getStoreInternals(store).$$setter('tabs', ['second']);
    setStore('active', 'second');
    flush();
    expect(seen).toEqual([
      {tabs: ['first', 'second'], active: 'first'},
      {tabs: ['second'], active: 'second'},
    ]);
    expect(store.accessor().active).toBe('second');
    stop();
    setStore('active', 'first');
    flush();
    expect(seen).toHaveLength(2);
  } finally {
    stop();
    fixture.dispose();
  }
});

test('replacing a root array also removes slots from the previous state', () => {
  const [items, setItems] = createSolidStore(['first', 'second', 'third']);
  const replace = createPathSetter(setItems);
  flush(() => replace(items => items.slice(1, 2)));
  expect([...items]).toEqual(['second']);
  flush(() => replace([]));
  expect(items).toHaveLength(0);
});
