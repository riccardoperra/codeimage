interface AspectRatioBase {
  name: string;
  resolution: [number, number];
  ratio: `${number} / ${number}` | `${number}`;
}

export type ExportTargetId =
  | 'x-landscape'
  | 'square'
  | 'linkedin-portrait'
  | 'open-graph';

export type AspectRatio = AspectRatioBase &
  (
    | {kind?: 'ratio'}
    | {
        kind: 'target';
        id: ExportTargetId;
      }
  );

export function getExportTarget(value: string | null | undefined) {
  return DEFAULT_ASPECT_RATIOS.find(
    (ratio): ratio is AspectRatio & {kind: 'target'} =>
      ratio.kind === 'target' && ratio.id === value,
  );
}

export const DEFAULT_ASPECT_RATIOS: ReadonlyArray<AspectRatio> = [
  {
    kind: 'ratio',
    name: '16:9',
    resolution: [1920, 1080],
    ratio: '16 / 9',
  },
  {
    kind: 'ratio',
    name: '3:2',
    resolution: [1920, 1280],
    ratio: '3 / 2',
  },
  {
    kind: 'ratio',
    name: '4:3',
    resolution: [1920, 1440],
    ratio: '4 / 3',
  },
  {
    kind: 'ratio',
    name: '5:4',
    resolution: [1920, 1536],
    ratio: '5 / 4',
  },
  {
    kind: 'ratio',
    name: '1:1',
    resolution: [1920, 1920],
    ratio: '1 / 1',
  },
  {
    kind: 'ratio',
    name: '4:5',
    resolution: [1080, 1350],
    ratio: '4 / 5',
  },
  {
    kind: 'ratio',
    name: '3:4',
    resolution: [1080, 1440],
    ratio: '3 / 4',
  },
  {
    kind: 'ratio',
    name: '2:3',
    resolution: [1080, 1620],
    ratio: '2 / 3',
  },
  {
    kind: 'ratio',
    name: '9:16',
    resolution: [1080, 1920],
    ratio: '9 / 16',
  },
  {
    kind: 'target',
    id: 'x-landscape',
    name: 'X landscape',
    resolution: [1600, 900],
    ratio: '16 / 9',
  },
  {
    kind: 'target',
    id: 'square',
    name: 'Square',
    resolution: [1080, 1080],
    ratio: '1 / 1',
  },
  {
    kind: 'target',
    id: 'linkedin-portrait',
    name: 'LinkedIn portrait',
    resolution: [1080, 1350],
    ratio: '4 / 5',
  },
  {
    kind: 'target',
    id: 'open-graph',
    name: 'Open Graph',
    resolution: [1200, 630],
    ratio: '40 / 21',
  },
];
