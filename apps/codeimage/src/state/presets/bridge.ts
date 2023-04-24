import {presets} from './../../i18n/presets';
import * as ApiTypes from '@codeimage/api/api-types';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {
  PersistedEditorState,
  PersistedTerminalState,
} from '@codeimage/store/editor/model';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {PersistedFrameState} from '@codeimage/store/frame/model';
import {appEnvironment} from '@core/configuration';
import {createEffect, createUniqueId, on} from 'solid-js';
import {unwrap} from 'solid-js/store';
import {makePlugin} from 'statebuilder';
import * as api from '../../data-access/preset';
import {useIdb} from '../../hooks/use-indexed-db';
import {Preset, PresetsArray} from './types';

export interface PresetData {
  frame: PersistedFrameState;
  terminal: PersistedTerminalState;
  editor: PersistedEditorState;
  localSyncId?: string;
  appVersion?: string;
}

export const withPresetBridge = (idbKey: string) =>
  makePlugin(
    store => {
      const idb = useIdb();
      const useInMemoryStore = () => !getAuth0State().loggedIn();
      function persistToIdb(data: PresetsArray) {
        return idb.set(idbKey, unwrap(data)).then();
      }

      createEffect(
        on(
          store,
          resource => {
            if (useInMemoryStore()) {
              persistToIdb(resource ?? []);
            }
          },
          {defer: true},
        ),
      );

      const bridge = {
        useInMemoryStore,
        persistToIdb,
        isLocalPreset(preset: Preset) {
          return preset.id === preset.data.localSyncId;
        },

        canSyncPreset(preset: Preset) {
          return !useInMemoryStore() && this.isLocalPreset(preset);
        },
        addNewPreset(
          name: string,
          data?: PresetData & ApiTypes.CreatePresetApi['response']['data'],
        ): Promise<Preset> {
          const presetData: PresetData = {
            ...(data ?? {
              frame: getFrameState().stateToPersist(),
              terminal: getTerminalState().stateToPersist(),
              editor: getRootEditorStore().stateToPersist(),
            }),
            appVersion: appEnvironment.version,
          };
          if (useInMemoryStore()) {
            const id = createUniqueId();
            presetData.localSyncId = id;
            return Promise.resolve({
              id,
              name,
              createdAt: new Date(),
              updatedAt: new Date(),
              version: 1,
              data: presetData,
            });
          } else {
            return api.createPreset({body: {name, data: presetData}});
          }
        },
        deletePreset(preset: Preset): Promise<Preset> {
          const inMemory = useInMemoryStore() || this.isLocalPreset(preset);
          return inMemory
            ? Promise.resolve(preset)
            : api.deletePreset({params: {id: preset.id}}).then(() => preset);
        },
        updatePreset(
          preset: Preset,
          name: string,
          data: PresetData,
        ): Promise<Preset> {
          const inMemory = useInMemoryStore() || this.isLocalPreset(preset);
          return inMemory
            ? Promise.resolve({...preset, name, data})
            : api.updatePreset({params: {id: preset.id}, body: {name, data}});
        },
      };
      return {bridge} as const;
    },
    {name: 'withPresetBridge'},
  );
