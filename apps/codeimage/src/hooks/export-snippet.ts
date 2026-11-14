import {createAsyncAction} from '@core/hooks/async-action';
import type {Resource} from 'solid-js';
import type {ExportImagePayload} from './use-export-image';
import {exportImage} from './use-export-image';

export function useExportSnippet(): [
  Resource<Blob | string | undefined>,
  (data: ExportImagePayload) => void,
] {
  const [data, {notify}] = createAsyncAction(
    async (ref: ExportImagePayload) => {
      return exportImage(ref);
    },
  );

  return [data, notify];
}
