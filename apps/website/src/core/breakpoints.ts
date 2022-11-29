import {createBreakpoints, createMediaQuery} from '@solid-primitives/media';

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

const breakpointsPx = {
  tablet: `${breakpoints.tablet}px`,
  desktop: `${breakpoints.desktop}px`,
  wide: `${breakpoints.wide}px`,
};

const matchBreakpoints = createBreakpoints(breakpointsPx);
const isXs = createMediaQuery(`(max-width: ${breakpointsPx.tablet})`);
const isTablet = createMediaQuery(
  `(max-width: ${breakpointsPx.desktop}) and (min-width: ${breakpointsPx.tablet})`,
);

export function injectBreakpoints() {
  return {
    matches: matchBreakpoints,
    isXs,
    isTablet,
  };
}
