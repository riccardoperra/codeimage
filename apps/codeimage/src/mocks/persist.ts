import {drop} from '@mswjs/data';
import {FactoryAPI} from '@mswjs/data/lib/glossary';
import {useIdb} from '../hooks/use-indexed-db';

const STORAGE_KEY_PREFIX = 'mswjs-data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function persistMswjs(db: FactoryAPI<any>) {
  const idb = useIdb();
  const key = `${STORAGE_KEY_PREFIX}`;

  const channel = new BroadcastChannel('mswjs/data/sync');
  channel.addEventListener('message', persistState);

  async function persistState() {
    const state: Record<string, unknown> = {};
    Object.entries(db).forEach(([k, entity]) => (state[k] = entity.getAll()));
    await idb.set(key, state);
  }

  async function hydrateState() {
    drop(db);
    const initialState = await idb.get(key);
    if (!initialState) {
      return;
    }
    Object.entries(db).forEach(([k, entity]) => {
      const value = initialState[k];
      if (value instanceof Array) {
        value.forEach(_ => entity.create(_));
      } else {
        entity.create(value);
      }
    });
  }

  window.addEventListener('load', hydrateState);
}
