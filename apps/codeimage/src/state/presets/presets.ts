import {ProjectEditorPersistedState} from '@codeimage/store/editor/model';
import {withEntityPlugin} from '@codeimage/store/plugins/withEntityPlugin';
import {withIndexedDbPlugin} from '@codeimage/store/plugins/withIndexedDbPlugin';
import {toast} from '@codeimage/ui';
import {createEffect, on, untrack} from 'solid-js';
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

function mergeDbPresetsWithLocalPresets(
  presets: Preset[],
  localPresets: Preset[],
) {
  return [
    ...localPresets.filter(
      localPreset =>
        !presets.find(preset => preset.data.localSyncId === localPreset.id),
    ),
    ...presets,
  ];
}

async function fetchInitialState() {
  const useInMemoryStore = !getAuth0State().loggedIn();
  const localPresets = await idb
    .get<PresetsArray>(idbKey)
    .then(data => data ?? ([] as PresetsArray))
    .catch(() => [] as PresetsArray);

  return (
    useInMemoryStore
      ? Promise.resolve(localPresets)
      : api
          .getAllPresets({})
          .then(presets =>
            mergeDbPresetsWithLocalPresets(presets, localPresets),
          )
  ).catch(() => [] as PresetsArray);
}

const PresetStoreDefinition = experimental__defineResource(fetchInitialState)
  .extend(withEntityPlugin<PresetsArray>())
  .extend(withIndexedDbPlugin<PresetsArray>(idbKey, []))
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
      sortedPresets() {
        if (store.loading) return [];
        return store().sort((a, b) =>
          store.bridge.isLocalPreset(a) || store.bridge.isLocalPreset(b)
            ? 1
            : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      },
      actions: {
        addNewPreset: store.asyncAction((payload: {name: string}) => {
          return untrack(() => {
            const currentState = store();
            return store.bridge
              .addNewPreset(payload.name)
              .then(preset => store.set(_ => [preset, ...(_ ?? [])]))
              .then(() => toast.success('Preset created successfully'))
              .catch(() => {
                store.set(currentState);
                toast.error('Error while creating preset', {
                  position: 'top-center',
                });
              });
          });
        }),
        deletePreset: store.asyncAction((payload: Preset) => {
          return untrack(() => {
            const currentState = store();
            store.entity.removeBy(preset => preset.id === payload.id);
            return store.bridge
              .deletePreset(payload)
              .then(() => toast.success('Preset deleted successfully'))
              .catch(() => {
                store.set(currentState);
                toast.error('Error while deleting preset', {
                  position: 'top-center',
                });
              });
          });
        }),
        syncPreset: store.asyncAction((payload: Preset) => {
          return untrack(() => {
            const currentState = store();
            return store.bridge
              .addNewPreset(payload.name)
              .then(preset =>
                store.entity.updateBy(
                  _ => _.id === payload.id,
                  () => preset,
                ),
              )
              .then(() => toast.success('Local preset has been synchronized'))
              .catch(() => {
                store.set(currentState);
                toast.error('Error while synchronizing preset', {
                  position: 'top-center',
                });
              });
          });
        }),
      },
    };
  });

export function getPresetsStore() {
  return provideAppState(PresetStoreDefinition);
}
