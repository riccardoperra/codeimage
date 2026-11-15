export const WINDOW_TYPES = [
  'macOs',
  'macOsGrayTheme',
  'macOsOutlineTheme',
  'windows',
  'card',
  'editor',
  'shell',
] as const;
export type WindowType = (typeof WINDOW_TYPES)[number];
export const WINDOW_SURFACES = ['solid', 'wash'] as const;
export type WindowSurface = (typeof WINDOW_SURFACES)[number];

export function parseWindowType(value: unknown): WindowType {
  if (value === 'terminal') return 'shell';
  return WINDOW_TYPES.find(type => type === value) ?? 'macOs';
}

export function parseSurface(value: unknown): WindowSurface {
  return WINDOW_SURFACES.find(surface => surface === value) ?? 'solid';
}
