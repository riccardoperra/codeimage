import {getAuth0State} from '@codeimage/store/auth/auth0';
import {ProjectEditorPersistedState} from '@codeimage/store/editor/model';
import {createUniqueId} from 'solid-js';
import {unwrap} from 'solid-js/store';
import {makePlugin} from 'statebuilder';
import * as api from '../../data-access/preset';
import {useIdb} from '../../hooks/use-indexed-db';
import {Preset, PresetsArray} from './types';

export const withPresetBridge = (idbKey: string) =>
  makePlugin(
    () => {
      const idb = useIdb();
      const useInMemoryStore = () => !getAuth0State().loggedIn();

      const bridge = {
        useInMemoryStore,
        persistToIdb(data: PresetsArray) {
          return idb.set(idbKey, unwrap(data)).then();
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
