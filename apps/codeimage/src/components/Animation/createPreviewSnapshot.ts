import type {AnimationSettings, NonEmpty} from '@core/animation/model';
import type {Accessor} from 'solid-js';
import {createMemo, createResource} from 'solid-js';
import type {CodeStyle, PreviewMeasurement, PreviewTab} from './planPreview';

export interface PreviewRequest {
  settings: AnimationSettings;
  tabs: NonEmpty<PreviewTab>;
  style: CodeStyle;
  key: string;
}

export function createPreviewSnapshot(
  request: Accessor<PreviewRequest | undefined>,
  measure: (request: PreviewRequest) => Promise<PreviewMeasurement>,
) {
  const source = createMemo<PreviewRequest | undefined>(previous => {
    const current = request();
    return current?.key === previous?.key ? previous : current;
  });
  const [measurement] = createResource(source, async request => ({
    key: request.key,
    measured: await measure(request),
  }));
  const snapshot = createMemo(() => {
    const current = request();
    if (!current || measurement.state !== 'ready') return undefined;
    const result = measurement()!;
    return result.key === current.key
      ? {settings: current.settings, measured: result.measured}
      : undefined;
  });
  return {measurement, snapshot};
}
