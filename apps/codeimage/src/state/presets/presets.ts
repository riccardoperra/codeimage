import {ProjectEditorPersistedState} from '@codeimage/store/editor/model';
import {createEffect, on} from 'solid-js';
import {withAsyncAction} from 'statebuilder/asyncAction';
import {provideAppState} from '..';
import * as api from '../../data-access/preset';
import {useIdb} from '../../hooks/use-indexed-db';
import {getAuth0State} from '../auth/auth0';
import {experimental__defineResource} from '../plugins/bindStateBuilderResource';
import {withPresetBridge} from './bridge';
import {Preset, PresetsArray} from './types';

const idbKey = 'presets';
const idb = useIdb();

async function fetchInitialState() {
  const useInMemoryStore = !getAuth0State().loggedIn();
  const localPresets = await idb
    .get<PresetsArray>(idbKey)
    .then(data => data ?? ([] as PresetsArray))
    .catch(() => [] as PresetsArray);

  return (
    useInMemoryStore
      ? Promise.resolve(localPresets)
      : api.getAllPresets({}).then(res => [...localPresets, ...res])
  )
    .then(data =>
      data.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    )
    .catch(() => [] as PresetsArray);
}

const PresetStoreDefinition = experimental__defineResource(
  () => fetchInitialState,
)
  .extend(withPresetBridge(idbKey))
  .extend(store => {
    createEffect(
      on(
        store,
        resource => {
          if (store.bridge.useInMemoryStore()) {
            store.bridge.persistToIdb(resource ?? []);
          }
        },
        {defer: true},
      ),
    );
  })
  .extend(withAsyncAction())
  .extend(store => {
    return {
      actions: {
        addNewPreset: store.asyncAction(
          (payload: {name: string; data: ProjectEditorPersistedState}) => {
            return store.bridge
              .addNewPreset(payload.name, payload.data)
              .then(preset => store.set(_ => [preset, ...(_ ?? [])]));
          },
        ),
        deletePreset: store.asyncAction((payload: Preset) => {
          return store.bridge
            .deletePreset(payload)
            .then(deletedPreset =>
              store.set(_ =>
                (_ ?? []).filter(preset => preset.id !== deletedPreset.id),
              ),
            );
        }),
      },
    };
  });

export function getPresetsStore() {
  return provideAppState(PresetStoreDefinition);
}
