import {GetPresetByIdApi} from '@codeimage/api/api-types';
import {ProjectEditorPersistedState} from '@codeimage/store/editor/model';
import {
  createEffect,
  createResource,
  createRoot,
  createUniqueId,
  on,
} from 'solid-js';
import * as api from '../../data-access/preset';
import {getAuth0State} from '../auth/auth0';
import {defineStore, makePlugin} from 'statebuilder';
import {useIdb} from '../../hooks/use-indexed-db';
import {bindStateBuilderResource} from '../plugins/bindStateBuilderResource';
import {withAsyncAction} from 'statebuilder/asyncAction';
import {provideAppState} from '..';
import {unwrap} from 'solid-js/store';

type PresetsArray = Array<GetPresetByIdApi['response']>;
type Preset = GetPresetByIdApi['response'];

const withPresetBridge = () =>
  makePlugin(
    () => {
      const useInMemoryStore = () => !getAuth0State().loggedIn();
      const idbKey = 'presets';
      const idb = useIdb();

      const bridge = {
        useInMemoryStore,
        persistToIdb(data: PresetsArray) {
          return idb.set(idbKey, unwrap(data)).then();
        },
        fetchPresets(): Promise<PresetsArray> {
          return (
            !!useInMemoryStore()
              ? idb
                  .get<PresetsArray>(idbKey)
                  .then(data => data ?? [])
                  .catch(() => [])
              : api.getAllPresets({}).catch(() => [])
          ).then(data =>
            data.sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
            ),
          );
        },
        addNewPreset(
          name: string,
          data: ProjectEditorPersistedState,
        ): Promise<Preset> {
          return useInMemoryStore()
            ? Promise.resolve({
                id: createUniqueId(),
                name,
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1,
                data,
              })
            : api.createPreset({
                body: {
                  name,
                  data,
                },
              });
        },
        deletePreset(preset: Preset): Promise<Preset> {
          return useInMemoryStore()
            ? Promise.resolve(preset)
            : api.deletePreset({params: {id: preset.id}}).then(() => preset);
        },
        updatePreset(
          preset: Preset,
          name: string,
          data: ProjectEditorPersistedState,
        ): Promise<Preset> {
          return useInMemoryStore()
            ? Promise.resolve({...preset, name, data})
            : api.updatePreset({params: {id: preset.id}, body: {name, data}});
        },
      };
      return {bridge};
    },
    {name: 'withPresetBridge'},
  );

const PresetStoreInt = defineStore<PresetsArray>(() => [])
  .extend(withPresetBridge())
  .extend(store => {
    const [presetResource, {mutate, refetch}] = createResource(
      () => store.bridge.fetchPresets(),
      {
        storage: bindStateBuilderResource(store),
      },
    );

    createEffect(
      on(
        presetResource,
        resource => {
          if (store.bridge.useInMemoryStore()) {
            store.bridge.persistToIdb(resource ?? []);
          }
        },
        {defer: true},
      ),
    );

    createEffect(() => console.log('preset', presetResource()));
    return {presetResource, mutate, refetch};
  })
  .extend(withAsyncAction())
  .extend(store => {
    return {
      actions: {
        addNewPreset: store.asyncAction(
          (payload: {name: string; data: ProjectEditorPersistedState}) => {
            return store.bridge
              .addNewPreset(payload.name, payload.data)
              .then(preset => store.mutate(_ => [preset, ...(_ ?? [])]));
          },
        ),
        deletePreset: store.asyncAction((payload: Preset) => {
          return store.bridge
            .deletePreset(payload)
            .then(deletedPreset =>
              store.mutate(_ =>
                (_ ?? []).filter(preset => preset.id !== deletedPreset.id),
              ),
            );
        }),
      },
    };
  });

export const PresetsStore = () => {
  return provideAppState(PresetStoreInt);
};

const presetsStore = createRoot(PresetsStore);

export function getPresetsStore() {
  return presetsStore;
}
