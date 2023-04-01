import {GetPresetByIdApi} from '@codeimage/api/api-types';
import {ProjectEditorPersistedState} from '@codeimage/store/editor/model';
import {createEffect, createRoot, createUniqueId, on} from 'solid-js';
import * as api from '../../data-access/preset';
import {getAuth0State} from '../auth/auth0';
import {makePlugin} from 'statebuilder';
import {useIdb} from '../../hooks/use-indexed-db';
import {experimental__defineResource} from '../plugins/bindStateBuilderResource';
import {withAsyncAction} from 'statebuilder/asyncAction';
import {provideAppState} from '..';
import {unwrap} from 'solid-js/store';

type PresetsArray = Array<GetPresetByIdApi['response']>;
type Preset = GetPresetByIdApi['response'];

const idbKey = 'presets';
const idb = useIdb();

const withPresetBridge = () =>
  makePlugin(
    () => {
      const useInMemoryStore = () => !getAuth0State().loggedIn();

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

const PresetStoreDefinition = experimental__defineResource(() => async () => {
  const useInMemoryStore = !getAuth0State().loggedIn();
  return (
    !!useInMemoryStore
      ? idb
          .get<PresetsArray>(idbKey)
          .then(data => data ?? [])
          .catch(() => [])
      : api.getAllPresets({}).catch(() => [])
  )
    .then(data =>
      data.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    )
    .then(res => new Promise<typeof res>(r => setTimeout(() => r(res), 5000)));
})
  .extend(withPresetBridge())
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

export const PresetsStore = () => {
  return provideAppState(PresetStoreDefinition);
};

const presetsStore = createRoot(PresetsStore);

export function getPresetsStore() {
  return presetsStore;
}
