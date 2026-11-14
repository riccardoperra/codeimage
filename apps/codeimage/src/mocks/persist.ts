import {get, set} from 'idb-keyval';
import {db} from './db';

const STORAGE_KEY = 'mswjs-data';

type PersistedState = {
  project: ReturnType<typeof db.project.getAll>;
};

export async function hydrateDb() {
  const state = await get<PersistedState>(STORAGE_KEY);
  state?.project.forEach(project => db.project.create(project));
}

export function persistDb() {
  return set(STORAGE_KEY, {project: db.project.getAll()});
}
