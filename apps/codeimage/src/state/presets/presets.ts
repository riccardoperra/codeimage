import {GetPresetByIdApi} from '@codeimage/api/api-types';
import {ProjectEditorPersistedState} from '@codeimage/store/editor/model';
import {createResource, createRoot} from 'solid-js';
import * as api from '../../data-access/preset';

type PresetsArray = Array<GetPresetByIdApi['response']>;

export const PresetsStore = () => {
  // TODO: refactor supporting mutate
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [presets, {mutate, refetch}] = createResource(() => fetchPresets(), {
    initialValue: [],
  });

  function fetchPresets(): Promise<PresetsArray> {
    return api
      .getAllPresets({})
      .then(data =>
        data.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
      );
  }

  // TODO: check if this interface is ok
  function addNewPreset(name: string, data: ProjectEditorPersistedState) {
    return api
      .createPreset({
        body: {
          name,
          data,
        },
      })
      .then(() => refetch());
  }

  function deletePreset(id: string) {
    return api.deletePreset({params: {id}}).then(() => refetch());
  }

  function updatePreset(
    id: string,
    name: string,
    data: ProjectEditorPersistedState,
  ) {
    return api
      .updatePreset({params: {id}, body: {name, data}})
      .then(() => refetch());
  }

  return {
    presets,
    actions: {
      addNewPreset,
      deletePreset,
      updatePreset,
      refetch,
    } as const,
  };
};

const presetsStore = createRoot(PresetsStore);

export function getPresetsStore() {
  return presetsStore;
}
