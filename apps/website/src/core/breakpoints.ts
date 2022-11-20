export const breakpointNames = ['mobile', 'tablet', 'desktop', 'wide'] as const;

export const breakpoints = {
  mobile: 0,
  tablet: 740,
  desktop: 992,
  wide: 1200,
  wideLg: 1440,
  wideXl: 1920,
} as const;

export type Breakpoint = keyof typeof breakpoints;
