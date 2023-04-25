import * as ApiTypes from '@codeimage/api/api-types';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {generateUid} from '@codeimage/store/plugins/unique-id';
import {appEnvironment} from '@core/configuration';
import {createEffect, createUniqueId, on} from 'solid-js';
import {unwrap} from 'solid-js/store';
import {makePlugin} from 'statebuilder';
import * as api from '../../data-access/preset';
import {useIdb} from '../../hooks/use-indexed-db';
import {Preset, PresetData, PresetsArray} from './types';

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

      const getPresetDataFromState = () => {
        const frameState = getFrameState().stateToPersist();
        const terminalState = getTerminalState().stateToPersist();
        const editorState = getRootEditorStore().stateToPersist();
        const presetData: PresetData = {
          appVersion: appEnvironment.version,
          frame: {
            background: frameState.background!,
            opacity: frameState.opacity,
            padding: frameState.padding,
            visible: frameState.visible,
            radius: frameState.radius,
          },
          terminal: {
            opacity: terminalState.opacity,
            background: terminalState.background,
            accentVisible: terminalState.accentVisible,
            alternativeTheme: terminalState.alternativeTheme,
            shadow: terminalState.shadow,
            showGlassReflection: terminalState.showGlassReflection,
            type: terminalState.type,
            showHeader: terminalState.showHeader,
            showWatermark: terminalState.showWatermark,
            textColor: terminalState.textColor,
          },
          editor: {
            fontId: editorState.options.fontId,
            fontWeight: editorState.options.fontWeight,
            showLineNumbers: editorState.options.showLineNumbers,
            themeId: editorState.options.themeId,
            enableLigatures: editorState.options.enableLigatures,
          },
        };
        return presetData;
      };

      const bridge = {
        useInMemoryStore,
        persistToIdb,
        getPresetDataFromState,
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
          const presetData: PresetData = data ?? getPresetDataFromState();
          if (useInMemoryStore()) {
            const id = generateUid();
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
