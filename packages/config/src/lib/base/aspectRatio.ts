export interface AspectRatio {
  name: string;
  resolution: [number, number];
  ratio: `${number} / ${number}` | `${number}`;
}

export const DEFAULT_ASPECT_RATIOS: ReadonlyArray<AspectRatio> = [
  {
    name: '16:9',
    resolution: [1920, 1080],
    ratio: '16 / 9',
  },
  {
    name: '3:2',
    resolution: [1920, 1280],
    ratio: '3 / 2',
  },
  {
    name: '4:3',
    resolution: [1920, 1440],
    ratio: '4 / 3',
  },
  {
    name: '5:4',
    resolution: [1920, 1536],
    ratio: '5 / 4',
  },
  {
    name: '1:1',
    resolution: [1920, 1920],
    ratio: '1 / 1',
  },
  {
    name: '4:5',
    resolution: [1080, 1350],
    ratio: '4 / 5',
  },
  {
    name: '3:4',
    resolution: [1080, 1440],
    ratio: '3 / 4',
  },
  {
    name: '2:3',
    resolution: [1080, 1620],
    ratio: '2 / 3',
  },
  {
    name: '9:16',
    resolution: [1080, 1920],
    ratio: '9 / 16',
  },
];
