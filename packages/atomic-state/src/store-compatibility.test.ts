import {createRoot, createStore as createSolidStore, flush} from 'solid-js';
import {expect, test, vi} from 'vitest';
import {tap} from 'rxjs';
import {createStore} from './createStore';
import {createPathSetter} from './createPathSetter';
import {getStoreInternals} from './getStoreInternals';
import {effect} from './experimental/effects';

vi.mock('solid-js', () =>
  vi.importActual(
    new URL('./dist/solid.js', import.meta.resolve('solid-js/package.json'))
      .pathname,
  ),
);

test('publishes one committed state for related writes and stops on unsubscribe', () => {
  const fixture = createRoot(dispose => {
    const [store, setStore, {state$}] = createStore({
      tabs: ['first', 'second'],
      active: 'first',
    });
    return {dispose, store, setStore, state$};
  });
  const seen: {tabs: string[]; active: string}[] = [];
  const subscription = fixture.state$.subscribe(({tabs, active}) =>
    seen.push({tabs: [...tabs], active}),
  );
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
    subscription.unsubscribe();
    setStore('active', 'first');
    flush();
    expect(seen).toHaveLength(2);
  } finally {
    subscription.unsubscribe();
    fixture.dispose();
  }
});

test('the effect exposes its loading state and stops processing on dispose', () => {
  const handled: string[] = [];
  const dispatch = effect<string>(source =>
    source.pipe(tap(value => handled.push(value))),
  );
  const states: boolean[] = [];
  const subscription = dispatch.loading.subscribe(value => states.push(value));
  try {
    flush();
    dispatch('first');
    flush();
    expect(handled).toEqual(['first']);
    expect(dispatch.loading()).toBe(false);
    expect(states.at(-1)).toBe(false);
    dispatch.dispose();
    dispatch('after disposal');
    expect(handled).toEqual(['first']);
  } finally {
    subscription.unsubscribe();
    dispatch.dispose();
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
